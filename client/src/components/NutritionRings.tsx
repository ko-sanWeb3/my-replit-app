import { useEffect, useRef } from "react";

interface NutritionRingsProps {
  nutritionData?: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export default function NutritionRings({ nutritionData }: NutritionRingsProps) {
  const ringsRef = useRef<HTMLDivElement>(null);

  const data = nutritionData || { protein: 0, carbs: 0, fats: 0 };

  useEffect(() => {
    // Animate rings on mount
    const rings = ringsRef.current?.querySelectorAll('path[stroke-dasharray]');
    if (!rings) return;

    rings.forEach((ring, index) => {
      const pathElement = ring as SVGPathElement;
      pathElement.style.transition = 'stroke-dasharray 1s ease-in-out';
      pathElement.style.strokeDasharray = '0, 100';
      
      setTimeout(() => {
        const originalDasharray = pathElement.getAttribute('data-target') || '0, 100';
        pathElement.style.strokeDasharray = originalDasharray;
      }, 300 + (index * 200));
    });
  }, [data]);

  const createRing = (percentage: number, color: string, label: string) => {
    const dashArray = `${Math.min(percentage, 100)}, 100`;
    
    return (
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-2">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path 
              className="text-gray-200" 
              stroke="currentColor" 
              strokeWidth="3" 
              fill="none" 
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path 
              className={color} 
              stroke="currentColor" 
              strokeWidth="3" 
              fill="none" 
              strokeLinecap="round"
              strokeDasharray={dashArray}
              data-target={dashArray}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-600">{label}</span>
      </div>
    );
  };

  return (
    <div ref={ringsRef} className="grid grid-cols-3 gap-4 mb-6">
      {createRing(data.protein, "text-primary", "タンパク質")}
      {createRing(data.carbs, "text-warning", "炭水化物")}
      {createRing(data.fats, "text-purple-600", "脂質")}
    </div>
  );
}
