import Column from "./Column";

export default function Dashboard() {
  const columnsAmount = 3;
  const rowsAmount = 3;

  return (
    <div className="flex justify-center items-center gap-4 w-auto h-screen">
      {[...Array(columnsAmount)].map((_, colIndex) => (
        <Column key={colIndex} length={rowsAmount} colIndex={colIndex} />
      ))}
    </div>
  );
}
