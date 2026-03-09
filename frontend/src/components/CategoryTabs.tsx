type Props = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
};

export default function CategoryTabs({ categories, selected, onSelect }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16 }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: "8px 14px",
          borderRadius: 999,
          border: "1px solid #ddd",
          background: selected === null ? "#111" : "#fff",
          color: selected === null ? "#fff" : "#111",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Все
      </button>

      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid #2a2a2d",
            background: selected === category ? "#ff6b35" : "#1a1a1d",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {category}
        </button>
      ))}
    </div>
  );
}