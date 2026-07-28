// components/lab/DnDComponents.tsx
// Fixed Drag and Drop components with proper TypeScript types

import React, { useCallback, useRef } from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { XYCoord } from 'react-dnd-html5-backend';

// Item types
export const ItemTypes = {
  EQUIPMENT: 'equipment',
  CHEMICAL: 'chemical',
  WORKBENCH_ITEM: 'workbench_item',
  PHYSICS_COMPONENT: 'physics_component',
  WIRE: 'wire',
};

// Drag item interfaces
export interface DragItem {
  type: string;
  id?: string;
  equipmentType?: string;
  chemicalId?: string;
}

// Props interfaces
interface DraggableEquipmentProps {
  type: string;
  icon?: string;
  label?: string;
}

interface DraggableChemicalProps {
  chemical: {
    id: string;
    name: string;
    formula: string;
    hazardSymbols?: string[];
  };
}

interface WorkbenchItemProps {
  item: {
    id: string;
    type: string;
    position: { x: number; y: number };
    contents?: { chemicalId: string; volume: number }[];
    isHeating?: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onDropChemical?: (chemicalId: string) => void;
}

/**
 * Draggable Equipment Component
 * Uses useDrag hook with proper ref handling
 */
export const DraggableEquipment: React.FC<DraggableEquipmentProps> = ({ type, icon, label }) => {
  const dragRef = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: ItemTypes.EQUIPMENT,
    item: { 
      type: ItemTypes.EQUIPMENT, 
      equipmentType: type 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [type]);

  // Connect drag ref to DOM element
  const attachRef = useCallback((node: HTMLDivElement | null) => {
    drag(node);
    // @ts-ignore - Store ref for potential future use
    dragRef.current = node;
  }, [drag]);

  return (
    <div
      ref={attachRef}
      className={`p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <span className="text-sm font-medium">
          {label || type.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
};

/**
 * Draggable Chemical Component
 * Shows chemical info and hazard warnings
 */
export const DraggableChemical: React.FC<DraggableChemicalProps> = ({ chemical }) => {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: ItemTypes.CHEMICAL,
    item: { 
      type: ItemTypes.CHEMICAL, 
      chemicalId: chemical.id 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [chemical.id]);

  const hazardColors: Record<string, string> = {
    'corrosive': 'border-red-500 bg-red-50',
    'flammable': 'border-orange-500 bg-orange-50',
    'toxic': 'border-purple-500 bg-purple-50',
  };

  const hazardClass = chemical.hazardSymbols?.[0] 
    ? hazardColors[chemical.hazardSymbols[0]] || 'border-gray-200'
    : 'border-gray-200';

  return (
    <div
      ref={(node) => drag(node)}
      className={`p-3 bg-white border-2 ${hazardClass} rounded-lg cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="text-sm font-medium">{chemical.name}</div>
      <div className="text-xs text-gray-500 font-mono">{chemical.formula}</div>
      {chemical.hazardSymbols && (
        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <span>⚠️</span>
          <span>{chemical.hazardSymbols.join(', ')}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Workbench Item Component
 * Combines drag source and drop target
 */
export const WorkbenchItem: React.FC<WorkbenchItemProps> = ({
  item,
  isSelected,
  onSelect,
  onMove,
  onDropChemical
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Make the item draggable
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: ItemTypes.WORKBENCH_ITEM,
    item: { type: ItemTypes.WORKBENCH_ITEM, id: item.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [item.id]);

  // Make the item a drop target for chemicals
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: ItemTypes.CHEMICAL,
    drop: (droppedItem: DragItem) => {
      if (droppedItem.chemicalId && onDropChemical) {
        onDropChemical(droppedItem.chemicalId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDropChemical]);

  // Combine refs
  const attachRef = useCallback((node: HTMLDivElement | null) => {
    drag(drop(node));
    // @ts-ignore
    ref.current = node;
  }, [drag, drop]);

  // Equipment styling
  const getEquipmentStyle = (type: string): string => {
    const styles: Record<string, string> = {
      'beaker': 'bg-blue-50 border-blue-300',
      'test_tube': 'bg-green-50 border-green-300',
      'flask': 'bg-purple-50 border-purple-300',
      'burette': 'bg-yellow-50 border-yellow-300',
      'pipette': 'bg-pink-50 border-pink-300',
      'measuring_cylinder': 'bg-indigo-50 border-indigo-300',
      'bunsen_burner': 'bg-red-50 border-red-300',
      'tripod_stand': 'bg-gray-50 border-gray-300',
      'wire_gauze': 'bg-orange-50 border-orange-300',
      'funnel': 'bg-teal-50 border-teal-300',
      'filter_paper': 'bg-white border-gray-200',
      'evaporating_dish': 'bg-cyan-50 border-cyan-300',
      'thermometer': 'bg-rose-50 border-rose-300',
    };
    return styles[type] || 'bg-gray-50 border-gray-300';
  };

  const getEquipmentIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'beaker': '🧪',
      'test_tube': '🧫',
      'flask': '⚗️',
      'burette': '💉',
      'pipette': '💧',
      'measuring_cylinder': '📏',
      'bunsen_burner': '🔥',
      'tripod_stand': '🔺',
      'wire_gauze': '🔲',
      'funnel': '🔽',
      'filter_paper': '📄',
      'evaporating_dish': '🥘',
      'thermometer': '🌡️',
    };
    return icons[type] || '🔬';
  };

  return (
    <div
      ref={attachRef}
      className={`absolute p-3 border-2 rounded-lg cursor-move transition-all ${
        getEquipmentStyle(item.type)
      } ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''
      } ${
        isDragging ? 'opacity-50' : ''
      } ${
        isOver && canDrop ? 'ring-2 ring-green-400 bg-green-50' : ''
      }`}
      style={{ 
        left: item.position.x, 
        top: item.position.y,
        zIndex: isDragging ? 1000 : isSelected ? 10 : 1
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="text-center min-w-[60px]">
        <span className="text-2xl block">{getEquipmentIcon(item.type)}</span>
        <div className="text-xs mt-1 font-medium capitalize">
          {item.type.replace(/_/g, ' ')}
        </div>
        
        {/* Contents Display */}
        {item.contents && item.contents.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.contents.map((content, idx) => (
              <div 
                key={idx} 
                className="text-xs bg-white bg-opacity-70 rounded px-2 py-0.5"
              >
                {content.volume}mL
              </div>
            ))}
          </div>
        )}

        {/* Heating indicator */}
        {item.isHeating && (
          <div className="mt-1 text-xs text-red-600 animate-pulse">
            Heating...
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Circuit Component (Physics)
 * Draggable circuit element
 */
export const CircuitComponent: React.FC<{
  type: string;
  icon: string;
  label: string;
}> = ({ type, icon, label }) => {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: ItemTypes.PHYSICS_COMPONENT,
    item: { 
      type: ItemTypes.PHYSICS_COMPONENT, 
      equipmentType: type 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [type]);

  return (
    <div
      ref={(node) => drag(node)}
      className={`p-3 bg-white border rounded-lg cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
};

/**
 * Drop Zone Component
 * Area where items can be dropped
 */
export const DropZone: React.FC<{
  onDrop: (item: DragItem, position: { x: number; y: number }) => void;
  children?: React.ReactNode;
  className?: string;
}> = ({ onDrop, children, className }) => {
  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: [ItemTypes.EQUIPMENT, ItemTypes.PHYSICS_COMPONENT],
    drop: (item: DragItem, monitor) => {
      const offset = monitor.getClientOffset();
      const dropZoneRect = dropRef.current?.getBoundingClientRect();
      
      if (offset && dropZoneRect) {
        onDrop(item, {
          x: offset.x - dropZoneRect.left - 40, // Center the item
          y: offset.y - dropZoneRect.top - 40
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop]);

  const attachRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
    // @ts-ignore
    dropRef.current = node;
  }, [drop]);

  return (
    <div
      ref={attachRef}
      className={`relative ${
        isOver && canDrop ? 'bg-blue-50 border-blue-400' : 'border-gray-300'
      } border-2 border-dashed rounded-lg transition-colors ${className || ''}`}
    >
      {children}
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-30 flex items-center justify-center rounded-lg">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg text-blue-600 font-semibold">
            Drop here to add equipment
          </div>
        </div>
      )}
    </div>
  );
};