export default function Card(props) {
  return (
    <div className="liquid-glass cursor-grab flex justify-center items-center p-8 w-48 min-h-[120px]">
      <h1>{props.text}</h1>
    </div>
  );
}
