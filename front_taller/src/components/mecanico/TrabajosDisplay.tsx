import {
  fotosNuevosDeTrabajo,
  fotosViejosDeTrabajo,
  parsearTrabajos,
} from "@/src/lib/trabajos";

type Props = {
  descripcionTrabajo: string | null | undefined;
  className?: string;
};

function GaleriaFotos({ titulo, fotos }: { titulo: string; fotos: string[] }) {
  if (fotos.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-3 min-h-[80px]">
        <p className="text-xs text-gray-500 mb-2">{titulo}</p>
        <p className="text-xs text-gray-600">Sin fotos</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-2">{titulo}</p>
      <div className="flex flex-col gap-2">
        {fotos.map((foto, index) => (
          <img
            key={`${foto}-${index}`}
            src={foto}
            alt={`${titulo} ${index + 1}`}
            className="rounded-lg w-full object-cover border border-[#333] max-h-48"
          />
        ))}
      </div>
    </div>
  );
}

export default function TrabajosDisplay({ descripcionTrabajo, className = "" }: Props) {
  const trabajos = parsearTrabajos(descripcionTrabajo);

  if (!descripcionTrabajo?.trim()) return null;

  if (!trabajos) {
    return (
      <p className={`text-sm text-gray-300 leading-relaxed ${className}`}>{descripcionTrabajo}</p>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {trabajos.map((trabajo, index) => {
        const viejos = fotosViejosDeTrabajo(trabajo);
        const nuevos = fotosNuevosDeTrabajo(trabajo);

        return (
          <div
            key={`${trabajo.parte}-${index}`}
            className="bg-[#262626] rounded-lg px-3 py-2.5 text-sm border border-[#333]"
          >
            <p className="font-medium text-white">{trabajo.parte}</p>
            <p className="text-gray-300 mt-0.5 leading-relaxed">{trabajo.descripcion}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <GaleriaFotos titulo="Repuestos viejos" fotos={viejos} />
              <GaleriaFotos titulo="Repuestos nuevos" fotos={nuevos} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
