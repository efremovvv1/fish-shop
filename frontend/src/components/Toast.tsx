type Props = {
  message: string;
  type?: "success" | "error" | "info";
};

export default function Toast({ message, type = "info" }: Props) {
  const bg =
    type === "success" ? "#183a24" :
    type === "error" ? "#4a1f1f" :
    "#1d1d22";

  const border =
    type === "success" ? "#2f8f4e" :
    type === "error" ? "#c94b4b" :
    "#2a2a30";

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 2000,
        background: bg,
        color: "#fff",
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: "14px 16px",
        minWidth: 260,
        boxShadow: "0 10px 24px rgba(0,0,0,0.3)",
      }}
    >
      {message}
    </div>
  );
}