import logoFull from "./brand/logo-full.png";

/** URS logo — transparent PNG from `design/Pixel.png`. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return <img src={logoFull} alt="URS Pharmacy" style={{ width: size, height: "auto" }} />;
}

export function LogoCompact({ height = 44 }: { height?: number }) {
  return <img src={logoFull} alt="URS Pharmacy" style={{ height, width: "auto" }} />;
}

export function LogoFull({ height = 44 }: { height?: number }) {
  return <LogoCompact height={height} />;
}

export function LogoCompactOnDark({ height = 44 }: { height?: number }) {
  return <img src={logoFull} alt="URS Pharmacy" style={{ height, width: "auto" }} />;
}

export function LogoHeroLight({ width = 260 }: { width?: number }) {
  return <img src={logoFull} alt="URS Pharmacy" style={{ width, height: "auto" }} />;
}

export function LogoHero({ width = 260 }: { width?: number }) {
  return <LogoHeroLight width={width} />;
}
