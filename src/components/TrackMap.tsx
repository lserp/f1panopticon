import React, { useRef, useEffect, useState } from 'react';
import type { TrackData, CarPosition, PitExitAnalysis } from '../types';

export interface TrackMapProps {
  trackData: TrackData;
  carPositions?: CarPosition[];
  highlightedDistance?: number;
  pitExitAnalysis?: PitExitAnalysis;
  onDistanceClick?: (distance: number) => void;
  onDistanceHover?: (distance: number | null) => void;
  width?: number;
  height?: number;
  showCorners?: boolean;
  showSectors?: boolean;
  showDRSZones?: boolean;
  showPitLane?: boolean;
  showPitExitVisualization?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export const TrackMap: React.FC<TrackMapProps> = ({
  trackData,
  carPositions = [],
  highlightedDistance,
  pitExitAnalysis,
  onDistanceClick,
  onDistanceHover,
  width = 800,
  height = 600,
  showCorners = true,
  showSectors = true,
  showDRSZones = true,
  showPitLane = true,
  showPitExitVisualization = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredDistance, setHoveredDistance] = useState<number | null>(null);

  // Calculate bounds and scale for track coordinates
  const calculateBounds = () => {
    if (trackData.coordinates.length === 0) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1, scaleX: 1, scaleY: 1 };
    }

    const xs = trackData.coordinates.map((c) => c.x);
    const ys = trackData.coordinates.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 40;
    const trackWidth = maxX - minX;
    const trackHeight = maxY - minY;
    const scaleX = (width - 2 * padding) / trackWidth;
    const scaleY = (height - 2 * padding) / trackHeight;
    const scale = Math.min(scaleX, scaleY);

    return { minX, maxX, minY, maxY, scaleX: scale, scaleY: scale };
  };

  // Convert track coordinates to canvas coordinates
  const toCanvasCoords = (x: number, y: number): Point => {
    const bounds = calculateBounds();
    const padding = 40;
    const canvasX = (x - bounds.minX) * bounds.scaleX + padding;
    const canvasY = (y - bounds.minY) * bounds.scaleY + padding;
    return { x: canvasX, y: canvasY };
  };

  // Find the closest track coordinate to a canvas point
  const findClosestDistance = (canvasX: number, canvasY: number): number | null => {
    if (trackData.coordinates.length === 0) return null;

    let minDist = Infinity;
    let closestDistance = null;

    for (const coord of trackData.coordinates) {
      const point = toCanvasCoords(coord.x, coord.y);
      const dist = Math.sqrt(Math.pow(point.x - canvasX, 2) + Math.pow(point.y - canvasY, 2));
      if (dist < minDist) {
        minDist = dist;
        closestDistance = coord.distance;
      }
    }

    // Only return if within reasonable distance (20 pixels)
    return minDist < 20 ? closestDistance : null;
  };

  // Render the track map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    if (trackData.coordinates.length === 0) return;

    // Draw track layout
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const firstPoint = toCanvasCoords(trackData.coordinates[0].x, trackData.coordinates[0].y);
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < trackData.coordinates.length; i++) {
      const point = toCanvasCoords(trackData.coordinates[i].x, trackData.coordinates[i].y);
      ctx.lineTo(point.x, point.y);
    }

    // Close the track loop
    ctx.lineTo(firstPoint.x, firstPoint.y);
    ctx.stroke();

    // Draw DRS zones
    if (showDRSZones && trackData.drsZones.length > 0) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 12;
      ctx.globalAlpha = 0.3;

      for (const drsZone of trackData.drsZones) {
        ctx.beginPath();
        let started = false;

        for (const coord of trackData.coordinates) {
          if (coord.distance >= drsZone.activationPoint && coord.distance <= drsZone.endPoint) {
            const point = toCanvasCoords(coord.x, coord.y);
            if (!started) {
              ctx.moveTo(point.x, point.y);
              started = true;
            } else {
              ctx.lineTo(point.x, point.y);
            }
          }
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    // Draw sectors
    if (showSectors && trackData.sectors.length > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';

      for (const sector of trackData.sectors) {
        // Find coordinate closest to sector start
        const sectorCoord = trackData.coordinates.find(
          (c) => Math.abs(c.distance - sector.startDistance) < 50
        );
        if (sectorCoord) {
          const point = toCanvasCoords(sectorCoord.x, sectorCoord.y);
          ctx.fillText(`S${sector.number}`, point.x + 5, point.y - 5);
        }
      }
    }

    // Draw corners
    if (showCorners && trackData.corners.length > 0) {
      for (const corner of trackData.corners) {
        // Find coordinate closest to corner
        const cornerCoord = trackData.coordinates.find(
          (c) => Math.abs(c.distance - corner.distance) < 50
        );
        if (cornerCoord) {
          const point = toCanvasCoords(cornerCoord.x, cornerCoord.y);

          // Draw corner marker
          ctx.fillStyle =
            corner.type === 'slow' ? '#ff4444' : corner.type === 'medium' ? '#ffaa44' : '#44ff44';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
          ctx.fill();

          // Draw corner number
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText(corner.number.toString(), point.x + 6, point.y - 6);
        }
      }
    }

    // Draw pit entry/exit markers
    if (showPitLane) {
      const drawPitMarker = (distance: number, label: string, color: string) => {
        const pitCoord = trackData.coordinates.find((c) => Math.abs(c.distance - distance) < 50);
        if (pitCoord) {
          const point = toCanvasCoords(pitCoord.x, pitCoord.y);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(label, point.x + 8, point.y + 3);
        }
      };

      drawPitMarker(trackData.pitEntry, 'PIT IN', '#ff8800');
      drawPitMarker(trackData.pitExit, 'PIT OUT', '#0088ff');
    }

    // Draw car positions
    if (carPositions.length > 0) {
      for (const car of carPositions) {
        const carCoord = trackData.coordinates.find(
          (c) => Math.abs(c.distance - car.distance) < 50
        );
        if (carCoord) {
          const point = toCanvasCoords(carCoord.x, carCoord.y);
          ctx.fillStyle = '#ffff00';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Draw position number
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(car.position.toString(), point.x, point.y);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        }
      }
    }

    // Draw pit exit visualization
    if (showPitExitVisualization && pitExitAnalysis) {
      // Draw the pit exit position with special marker
      const exitCoord = trackData.coordinates.find(
        (c) => Math.abs(c.distance - pitExitAnalysis.exitDistance) < 50
      );
      if (exitCoord) {
        const exitPoint = toCanvasCoords(exitCoord.x, exitCoord.y);

        // Draw pit exit marker (larger, distinct)
        ctx.fillStyle = '#ff00ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(exitPoint.x, exitPoint.y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw position change indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const posChange = pitExitAnalysis.positionAfter - pitExitAnalysis.positionBefore;
        const posText = posChange > 0 ? `+${posChange}` : posChange.toString();
        ctx.fillText(posText, exitPoint.x, exitPoint.y);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }

      // Draw cars ahead at pit exit moment
      if (pitExitAnalysis.carsAhead.length > 0) {
        for (const car of pitExitAnalysis.carsAhead) {
          const carCoord = trackData.coordinates.find(
            (c) => Math.abs(c.distance - car.distance) < 50
          );
          if (carCoord) {
            const point = toCanvasCoords(carCoord.x, carCoord.y);

            // Draw car ahead marker (green)
            ctx.fillStyle = '#00ff00';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Draw gap time
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px sans-serif';
            ctx.fillText(`+${car.gap.toFixed(1)}s`, point.x + 10, point.y - 10);
          }
        }
      }

      // Draw cars behind at pit exit moment
      if (pitExitAnalysis.carsBehind.length > 0) {
        for (const car of pitExitAnalysis.carsBehind) {
          const carCoord = trackData.coordinates.find(
            (c) => Math.abs(c.distance - car.distance) < 50
          );
          if (carCoord) {
            const point = toCanvasCoords(carCoord.x, carCoord.y);

            // Draw car behind marker (red)
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Draw gap time
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px sans-serif';
            ctx.fillText(`-${Math.abs(car.gap).toFixed(1)}s`, point.x + 10, point.y + 15);
          }
        }
      }

      // Draw gap visualization lines
      if (exitCoord) {
        const exitPoint = toCanvasCoords(exitCoord.x, exitCoord.y);

        // Draw line to nearest car ahead
        if (pitExitAnalysis.carsAhead.length > 0) {
          const nearestAhead = pitExitAnalysis.carsAhead[0];
          const aheadCoord = trackData.coordinates.find(
            (c) => Math.abs(c.distance - nearestAhead.distance) < 50
          );
          if (aheadCoord) {
            const aheadPoint = toCanvasCoords(aheadCoord.x, aheadCoord.y);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(exitPoint.x, exitPoint.y);
            ctx.lineTo(aheadPoint.x, aheadPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Draw line to nearest car behind
        if (pitExitAnalysis.carsBehind.length > 0) {
          const nearestBehind = pitExitAnalysis.carsBehind[0];
          const behindCoord = trackData.coordinates.find(
            (c) => Math.abs(c.distance - nearestBehind.distance) < 50
          );
          if (behindCoord) {
            const behindPoint = toCanvasCoords(behindCoord.x, behindCoord.y);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(exitPoint.x, exitPoint.y);
            ctx.lineTo(behindPoint.x, behindPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // Draw traffic impact indicator
      const impactColor =
        pitExitAnalysis.trafficImpact === 'clear'
          ? '#00ff00'
          : pitExitAnalysis.trafficImpact === 'minor'
            ? '#ffaa00'
            : '#ff0000';

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, height - 40, 150, 30);
      ctx.fillStyle = impactColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Traffic: ${pitExitAnalysis.trafficImpact}`, 15, height - 20);
    }

    // Draw highlighted distance
    if (highlightedDistance !== undefined) {
      const highlightCoord = trackData.coordinates.find(
        (c) => Math.abs(c.distance - highlightedDistance) < 50
      );
      if (highlightCoord) {
        const point = toCanvasCoords(highlightCoord.x, highlightCoord.y);
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Draw hovered distance
    if (hoveredDistance !== null) {
      const hoverCoord = trackData.coordinates.find(
        (c) => Math.abs(c.distance - hoveredDistance) < 50
      );
      if (hoverCoord) {
        const point = toCanvasCoords(hoverCoord.x, hoverCoord.y);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw distance tooltip
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(point.x + 15, point.y - 20, 80, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${Math.round(hoveredDistance)}m`, point.x + 20, point.y - 6);
      }
    }
  }, [
    trackData,
    carPositions,
    highlightedDistance,
    hoveredDistance,
    pitExitAnalysis,
    width,
    height,
    showCorners,
    showSectors,
    showDRSZones,
    showPitLane,
    showPitExitVisualization,
  ]);

  // Handle mouse move
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const distance = findClosestDistance(x, y);
    setHoveredDistance(distance);
    if (onDistanceHover) {
      onDistanceHover(distance);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredDistance(null);
    if (onDistanceHover) {
      onDistanceHover(null);
    }
  };

  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onDistanceClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const distance = findClosestDistance(x, y);
    if (distance !== null) {
      onDistanceClick(distance);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ cursor: 'crosshair', border: '1px solid #333' }}
    />
  );
};
