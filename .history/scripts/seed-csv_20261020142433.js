import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rawArg = process.argv[2] || 'fra_cleaned.csv';
const csvPath = path.resolve(process.cwd(), rawArg);

if (!fs.existsSync(csvPath)) {
  console.error(`\n❌ File not found at: ${csvPath}\n`);
  process.exit(1);
}

// Convert "accento-overdose-pride-edition" -> "Accento Overdose Pride Edition"
function formatTitle(str) {
  if (!str) return '';
  return str
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Capitalize brand/house name
function formatHouse(str) {
  if (!str) return '';
  return str
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function seedData() {
  const rows = [];
  console.log(`\nReading semicolon-delimited dataset from: ${csvPath}...`);

  fs.createReadStream(csvPath)
    .pipe(csv({ separator: ';' })) // Semicolon delimiter
    .on('data', (data) => {
      const rawName = data['Perfume'] || data['name'] || data['title'];
      const rawBrand = data['Brand'] || data['brand'] || data['house'];
      const rawGender = (data['Gender'] || data['gender'] || 'unisex').toLowerCase();

      // Normalize gender enum
      const gender =
        rawGender.includes('man') || rawGender.includes('men') || rawGender === 'masculine'
          ? 'masculine'
          : rawGender.includes('woman') || rawGender.includes('women') || rawGender === 'feminine'
          ? 'feminine'
          : 'unisex';

      // Combine Top, Middle, and Base columns
      const top = data['Top'] || '';
      const mid = data['Middle'] || '';
      const base = data['Base'] || '';
      const combinedNotes = `${top}, ${mid}, ${base}`;

      const notesArray = combinedNotes
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n.length > 1 && n.toLowerCase() !== 'unknown');

      const name = formatTitle(rawName);
      const house = formatHouse(rawBrand);

      if (name && house && notesArray.length > 0) {
        rows.push({
          name,
          house,
          gender,
          notes: Array.from(new Set(notesArray)), // Deduplicate
        });
      }
    })
    .on('end', async () => {
      console.log(`\nParsed ${rows.length} valid fragrances! Starting upload...`);

      if (rows.length === 0) {
        console.error('❌ Still parsed 0 rows. Double-check the file headers.');
        return;
      }

      // Batch insert in chunks of 500
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

      console.log('\n Ingestion complete! Refresh localhost:5173 to explore your expanded catalog.');
    });
}

seedData();