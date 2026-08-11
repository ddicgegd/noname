export interface ProductColorOption {
  id: string;
  title: string;
  label: string;
  price: string;
  swatchClass: string;
}

const colorOptionsByCategory: Record<string, Omit<ProductColorOption, "price">[]> = {
  ai: [
    { id: "c1", title: "Titanium Đen", label: "FP16 High Prec", swatchClass: "bg-zinc-950" },
    { id: "c2", title: "Titanium Tự Nhiên", label: "INT8 Light Quant", swatchClass: "bg-stone-300" },
  ],
  compute: [
    { id: "c1", title: "NVIDIA H100 Core", label: "80GB VRAM Dedicated", swatchClass: "bg-emerald-500" },
    { id: "c2", title: "NVIDIA A100 Core", label: "40GB VRAM Shared", swatchClass: "bg-sky-500" },
  ],
  storage: [
    { id: "c1", title: "Multi-Zone Sync", label: "3 AZ Redundant", swatchClass: "bg-purple-500" },
    { id: "c2", title: "Single-Zone Local", label: "LRS Cost Saving", swatchClass: "bg-slate-400" },
  ],
  network: [
    { id: "c1", title: "Anycast Global", label: "DDoS Mitigation Layer", swatchClass: "bg-cyan-500" },
    { id: "c2", title: "Unicast Local", label: "Basic DNS Defense", swatchClass: "bg-neutral-500" },
  ],
};

export const getProductColorOptions = (category: string, price: string): ProductColorOption[] => {
  const options = colorOptionsByCategory[category] || colorOptionsByCategory.network;
  return options.map((option) => ({ ...option, price }));
};
