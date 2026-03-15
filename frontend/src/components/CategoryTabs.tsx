type Props = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
};

export default function CategoryTabs({ categories, selected, onSelect }: Props) {
  const getButtonStyle = (active: boolean) => ({
    padding: "15px 18px",
    borderRadius: 18,
    border: active
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(255,255,255,0.08)",
    background: active
      ? "linear-gradient(180deg, #ff7a3d 0%, #ff6b35 100%)"
      : "rgba(7, 16, 24, 0.72)",
    color: "#fff",
    cursor: "pointer",
    textAlign: "left" as const,
    fontWeight: 700,
    fontSize: 16,
    backdropFilter: "blur(8px)",
    boxShadow: active
      ? "0 10px 24px rgba(255,107,53,0.28)"
      : "0 8px 20px rgba(0,0,0,0.16)",
    transition: "all 0.2s ease",
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <button onClick={() => onSelect(null)} style={getButtonStyle(selected === null)}>
        Все товары
      </button>

      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          style={getButtonStyle(selected === category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}