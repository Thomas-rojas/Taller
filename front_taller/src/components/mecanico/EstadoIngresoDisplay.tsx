import { parsearEstadoIngreso } from "@/src/lib/estadoIngreso";

type Props = {
  estadoMotoIngreso: string | null | undefined;
  className?: string;
};

export default function EstadoIngresoDisplay({ estadoMotoIngreso, className = "" }: Props) {
  const estado = parsearEstadoIngreso(estadoMotoIngreso);
  if (!estado) return null;
  if (!estado.descripcion && estado.fotos.length === 0 && estado.videos.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {estado.descripcion && (
        <p className="text-sm text-gray-200 leading-relaxed">{estado.descripcion}</p>
      )}
      {estado.fotos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {estado.fotos.map((foto) => (
            <img
              key={foto}
              src={foto}
              alt="Registro fotográfico al ingreso"
              className="rounded-lg max-h-56 w-full object-cover border border-[#333]"
            />
          ))}
        </div>
      )}
      {estado.videos.length > 0 && (
        <div className="flex flex-col gap-2">
          {estado.videos.map((video) => (
            <video
              key={video}
              src={video}
              controls
              playsInline
              className="rounded-lg w-full max-h-64 bg-black border border-[#333]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
