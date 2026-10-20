import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceCollide,
  forceLink,
  forceManyBody,
  forceCenter,
} from 'd3-force';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ScentCanvas({
  activeFragrance,
  neighbors,
  onSelectNode,
  highlightNote,
  highlightedNote, // Supported alias
}) {
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

  // Effective note to highlight
  const activeNote = highlightNote || highlightedNote || null;

  // Pan and Zoom Matrix State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Touch Gesture Tracking Refs
  const touchStateRef = useRef({
    initialDistance: null,
    initialScale: 1,
    lastTouch: { x: 0, y: 0 },
    isPinching: false,
  });

  // Hover Tooltip Card State
  const [hoveredNode, setHoveredNode] = useState(null);

  // Resize handler
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Force simulation
  useEffect(() => {
    if (!activeFragrance) return;

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    const focalNode = {
      id: activeFragrance.id,
      name: activeFragrance.name,
      house: activeFragrance.house,
      gender: activeFragrance.gender,
      notes: activeFragrance.notes || [],
      sharedNotes: [],
      similarity: 1,
      isSelected: true,
      fx: centerX,
      fy: centerY,
      x: centerX,
      y: centerY,
    };

    const surroundingNodes = (neighbors || []).map((item) => ({
      id: item.id,
      name: item.name,
      house: item.house,
      gender: item.gender,
      notes: item.notes || [],
      sharedNotes: item.shared_notes || [],
      similarity: item.similarity ?? 0,
      isSelected: false,
      fx: null,
      fy: null,
      x: centerX + (Math.random() - 0.5) * 160,
      y: centerY + (Math.random() - 0.5) * 160,
    }));

    const allGraphNodes = [focalNode, ...surroundingNodes];

    const graphLinks = surroundingNodes.map((neighbor) => ({
      source: focalNode.id,
      target: neighbor.id,
      distance: Math.max(95, 480 - neighbor.similarity * 800),
    }));

    // Collision radius scaled by name length to eliminate invisible bounding box overlaps
    const sim = forceSimulation(allGraphNodes)
      .force(
        'link',
        forceLink(graphLinks)
          .id((d) => d.id)
          .distance((d) => d.distance)
          .strength(0.85)
      )
      .force('charge', forceManyBody().strength(-180))
      .force(
        'collide',
        forceCollide()
          .radius((d) => Math.max(45, d.name.length * 5))
          .iterations(3)
      )
      .force('center', forceCenter(centerX, centerY).strength(0.04))
      .alpha(1)
      .alphaDecay(0.035);

    sim.on('tick', () => {
      setNodes([...allGraphNodes]);
    });

    return () => sim.stop();
  }, [activeFragrance, neighbors, dimensions]);

  // Desktop Mouse Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('[data-scent-node]')) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    };
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isPanning) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
    },
    [isPanning]
  );

  const handleMouseUp = () => setIsPanning(false);

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.35, prev.scale * zoomFactor), 2.5),
    }));
  };

  // Mobile Touch Event Handlers
  const getTouchDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('[data-scent-node]')) return;

    if (e.touches.length === 1) {
      touchStateRef.current.isPinching = false;
      touchStateRef.current.lastTouch = {
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y,
      };
    } else if (e.touches.length === 2) {
      touchStateRef.current.isPinching = true;
      touchStateRef.current.initialDistance = getTouchDistance(e.touches[0], e.touches[1]);
      touchStateRef.current.initialScale = transform.scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && !touchStateRef.current.isPinching) {
      setTransform((prev) => ({
        ...prev,
        x: e.touches[0].clientX - touchStateRef.current.lastTouch.x,
        y: e.touches[0].clientY - touchStateRef.current.lastTouch.y,
      }));
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      if (touchStateRef.current.initialDistance) {
        const factor = dist / touchStateRef.current.initialDistance;
        setTransform((prev) => ({
          ...prev,
          scale: Math.min(
            Math.max(0.35, touchStateRef.current.initialScale * factor),
            2.5
          ),
        }));
      }
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.initialDistance = null;
    touchStateRef.current.isPinching = false;
  };

  const handleZoom = (factor) => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.35, prev.scale * factor), 2.5),
    }));
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`w-full h-full relative select-none overflow-hidden touch-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Zoom / Pan Matrix Layer */}
      <div
        className="w-full h-full absolute inset-0 origin-center transition-transform duration-75 ease-out pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Radar Concentric Rings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r="120"
            fill="none"
            stroke="#cbd5e1"
            strokeDasharray="4 4"
          />
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r="240"
            fill="none"
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r="380"
            fill="none"
            stroke="#f1f5f9"
          />
        </svg>

        {/* Dynamic Nodes with Note Resonance */}
        {nodes.map((node) => {
          const isFocal = node.isSelected;

          // Check if this bottle contains the highlighted note
          const matchesHighlight = activeNote
            ? (node.notes || []).some(
                (n) => n.toLowerCase() === activeNote.toLowerCase()
              )
            : true;

          // Base font hierarchy
          const baseTextStyle = isFocal
            ? 'text-xl sm:text-2xl font-black text-black z-30 cursor-default'
            : node.similarity > 0.2
            ? 'text-sm sm:text-base font-semibold text-zinc-900 hover:text-blue-600 hover:scale-110 z-20 cursor-pointer'
            : node.similarity > 0.1
            ? 'text-xs sm:text-sm font-normal text-zinc-600 hover:text-zinc-950 z-10 cursor-pointer'
            : 'text-[11px] font-light text-zinc-400 hover:text-zinc-800 z-5 cursor-pointer';

          // Note Resonance styling
          let resonanceStyle = 'opacity-100';
          if (activeNote) {
            if (matchesHighlight) {
              resonanceStyle = isFocal
                ? 'opacity-100'
                : 'opacity-100 font-bold text-amber-900 scale-110 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)] z-25';
            } else {
              resonanceStyle = isFocal ? 'opacity-80' : 'opacity-15 blur-[0.4px] pointer-events-none';
            }
          }

          return (
            <button
              key={node.id}
              data-scent-node="true"
              onClick={(e) => {
                e.stopPropagation();
                if (!isFocal) onSelectNode(node);
              }}
              onMouseEnter={() => !isFocal && setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{
                left: `${node.x || 0}px`,
                top: `${node.y || 0}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute pointer-events-auto whitespace-nowrap outline-none px-2 py-1 select-none tracking-tight transition-all duration-150 ${baseTextStyle} ${resonanceStyle}`}
            >
              {node.name}
            </button>
          );
        })}
      </div>

      {/* Floating Hover Card */}
      {hoveredNode && (
        <div className="hidden sm:block absolute top-6 right-80 mr-6 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 rounded-xl p-3.5 shadow-xl max-w-xs pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400">
              {hoveredNode.house}
            </span>
            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {Math.round(hoveredNode.similarity * 100)}% Match
            </span>
          </div>
          <h3 className="text-sm font-bold text-zinc-900 mb-2">{hoveredNode.name}</h3>

          {hoveredNode.sharedNotes?.length > 0 ? (
            <div>
              <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                Shared Notes ({hoveredNode.sharedNotes.length}):
              </div>
              <div className="flex flex-wrap gap-1">
                {hoveredNode.sharedNotes.map((note) => (
                  <span
                    key={note}
                    className={`text-[10px] border px-1.5 py-0.2 rounded ${
                      activeNote && note.toLowerCase() === activeNote.toLowerCase()
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-zinc-400 italic">Connected by olfactive accord.</p>
          )}
        </div>
      )}

      {/* Viewport Zoom & Reset Controls */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-xs border border-zinc-200 p-1 rounded-xl shadow-md">
        <button
          onClick={() => handleZoom(1.2)}
          title="Zoom In"
          className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.8)}
          title="Zoom Out"
          className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset View"
          className="p-1.5 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}