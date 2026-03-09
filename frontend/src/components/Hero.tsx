export default function Hero() {
  return (
    <div
      style={{
        height: 260,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        marginBottom: 24,
        backgroundImage: "url('/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 34, margin: 0 }}>
          БАВАРИЯ 🐟 РЫБА
        </h1>

        <p
          style={{
            marginTop: 8,
            color: "#e5e5e5",
            maxWidth: 400,
          }}
        >
          Свежая рыба и морепродукты. Самовывоз в вашем городе.
        </p>
      </div>
    </div>
  );
}