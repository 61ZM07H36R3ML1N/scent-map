import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service_role key if available for bulk seeding bypass, otherwise anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE_PATH = process.argv[2] || './fragrances.csv';

async function seedData() {
  const rows = [];

  console.log(`Reading ${CSV_FILE_PATH}...`);

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (data) => {
      // 1. Normalize name and house
      const name = data.name || data.Name || data.title;
      const house = data.house || data.House || data.brand || data.Brand;
      const genderRaw = (data.gender || data.Gender || 'unisex').toLowerCase();

      // Normalize gender enum
      const gender =
        genderRaw.includes('man') || genderRaw.includes('men') || genderRaw === 'masculine'
          ? 'masculine'
          : genderRaw.includes('woman') || genderRaw.includes('women') || genderRaw === 'feminine'
          ? 'feminine'
          : 'unisex';

      // 2. Clean notes: handles single comma-separated strings or split top/mid/base columns
      const rawNotes =
        data.notes ||
        data.Notes ||
        [data.top_notes, data.middle_notes, data.base_notes].filter(Boolean).join(', ');

      const notesArray = rawNotes
        ? rawNotes
            .split(',')
            .map((n) => n.trim())
            .filter((n) => n.length > 1)
        : [];

      if (name && house && notesArray.length > 0) {
        rows.push({
          name: name.trim(),
          house: house.trim(),
          gender,
          notes: Array.from(new Set(notesArray)), // Deduplicate notes
        });
      }
    })
    .on('end', async () => {
      console.log(`Parsed ${rows.length} valid fragrances. Starting Supabase upload...`);

      // Batch insert in chunks of 500 to prevent payload timeout errors
      const CHUNK_SIZE = 500;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('fragrances').insert(chunk);

        if (error) {
          console.error(`Error uploading chunk ${i} - ${i + CHUNK_SIZE}:`, error.message);
        } else {
          console.log(`Uploaded ${Math.min(i + CHUNK_SIZE, rows.length)} / ${rows.length}`);
        }
      }

      console.log('Ingestion complete!');
    });
}

seedData();