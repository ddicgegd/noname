/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  type ErpAttribute,
  type ErpCategory,
  type ErpProduct,
  type Product,
  createErpProductDetail,
  getAttributeProductId,
  getErpCategoryCount,
  getSortedErpProducts,
  loadErpCatalog,
  loadGraphqlProductAttributes
} from "../lib/productCatalog";
import { getProductColorOptions } from "../lib/productColorSwatches";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BadgeCheckIcon,
  BoxesIcon,
  BrainCircuitIcon,
  CheckIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FilterIcon,
  GiftIcon,
  Grid2X2Icon,
  NetworkIcon,
  RefreshCcwIcon,
  SearchIcon,
  ServerIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  StarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";

const PRODUCTS: Product[] = [
  {
    id: "nexus-ai",
    name: "Nexus AI",
    category: "ai",
    tag: "New",
    tagType: "new",
    icon: "psychology",
    iconColor: "text-primary",
    desc: "Advanced language processing models tailored for enterprise applications.",
    price: "$0.02 / 1K tokens",
    bgColor: "bg-primary/10",
    longDesc: "Nexus AI delivers ultra-low latency, fine-tuned language intelligence for secure production workloads. Designed to integrate natively with your databases and knowledge bases to offer high-context automation, reasoning, and smart classification with military-grade safety alignments.",
    specs: [
      { label: "Context Window", value: "128K tokens" },
      { label: "Fine-Tuning support", value: "Available (LoRA, Full)" },
      { label: "Security", value: "VPC Endpoints & Encryption" },
    ],
  },
  {
    id: "aero-compute",
    name: "Aero Compute",
    category: "compute",
    tag: "Popular",
    tagType: "popular",
    icon: "memory",
    iconColor: "text-sky-500",
    desc: "High-performance virtual machines with dedicated GPUs for intense workloads.",
    price: "$0.45 / hr",
    bgColor: "bg-sky-500/10",
    longDesc: "Aero Compute provides state-of-the-art virtualized compute nodes equipped with modern high-bandwidth enterprise GPUs. Experience seamless autoscaling, instantaneous startup times, and tailored network interfaces optimized for large-scale graphics rendering, machine learning training, and complex numerical simulations.",
    specs: [
      { label: "vCPU Options", value: "Up to 128 Cores" },
      { label: "GPU Memory", value: "24GB - 80GB VRAM" },
      { label: "Local NVMe", value: "Up to 3.2TB" },
    ],
  },
  {
    id: "glacier-storage",
    name: "Glacier Storage",
    category: "storage",
    icon: "database",
    iconColor: "text-purple-500",
    desc: "Ultra-durable object storage for archival and long-term data retention.",
    price: "$0.004 / GB",
    bgColor: "bg-purple-500/10",
    longDesc: "Glacier Storage is the ultimate destination for cold data storage, backup archives, and regulatory compliance logs. Engineered for 99.999999999% durability, it offers instantaneous retrieval options and zero upfront egress fees for typical emergency restore patterns.",
    specs: [
      { label: "Durability SLA", value: "11 Nines (99.999999999%)" },
      { label: "Retrieval Time", value: "Configurable (Expedited: 1-5m)" },
      { label: "API Compatibility", value: "S3 compatible API" },
    ],
  },
  {
    id: "mesh-network",
    name: "Mesh Network",
    category: "network",
    tag: "Updated",
    tagType: "updated",
    icon: "lan",
    iconColor: "text-emerald-500",
    desc: "Global, low-latency content delivery network with edge computing capabilities.",
    price: "$0.08 / GB",
    bgColor: "bg-emerald-500/10",
    longDesc: "Mesh Network accelerates your APIs and static assets on our global fiber-optic backbone spanning over 120 edge nodes. Run light-weight serverless scripts on the edge to localize content delivery, translate headers, filter bad requests, and cache assets closer to your visitors.",
    specs: [
      { label: "Global Edge Nodes", value: "120+ Edge Locations" },
      { label: "Anycast IP routing", value: "Supported" },
      { label: "Edge Functions", value: "JavaScript/WASM support" },
    ],
  },
  {
    id: "vision-ai",
    name: "Vision AI",
    category: "ai",
    tag: "New",
    tagType: "new",
    icon: "visibility",
    iconColor: "text-primary",
    desc: "Real-time object detection, classification, and visual analysis engine.",
    price: "$0.005 / image",
    bgColor: "bg-primary/10",
    longDesc: "Vision AI provides robust computer vision APIs for identifying faces, text, objects, and sophisticated spatial dynamics in images and video streams. Designed for high-throughput retail intelligence, automated safety monitoring, and secure content moderation platforms.",
    specs: [
      { label: "FPS Capacity", value: "Up to 60 FPS live streaming" },
      { label: "Supported Formats", value: "PNG, JPEG, WebP, MP4, H.264" },
      { label: "Accuracy Rate", value: "99.4% on standard benchmarks" },
    ],
  },
  {
    id: "tensor-tpu",
    name: "Tensor TPU Cluster",
    category: "compute",
    tag: "Popular",
    tagType: "popular",
    icon: "developer_board",
    iconColor: "text-sky-500",
    desc: "Accelerated matrix processors optimized for training massive neural networks.",
    price: "$1.20 / hr",
    bgColor: "bg-sky-500/10",
    longDesc: "Unleash supercomputing power with our multi-pod Tensor TPU nodes. Specifically designed to speed up heavy matrix multiplications inherent in transformer-based models and complex generative AI frameworks. Includes native integration with TensorFlow, PyTorch, and JAX.",
    specs: [
      { label: "Flops Performance", value: "Up to 250 TFLOPS" },
      { label: "Interconnect", value: "Ultra-fast multi-pod fabric" },
      { label: "Framework support", value: "PyTorch, JAX, TensorFlow" },
    ],
  },
  {
    id: "chrono-db",
    name: "Chrono DB",
    category: "storage",
    icon: "schedule",
    iconColor: "text-purple-500",
    desc: "High-performance time-series database for industrial IoT and application metrics.",
    price: "$15.00 / million writes",
    bgColor: "bg-purple-500/10",
    longDesc: "Chrono DB is engineered specifically to capture, process, and analyze hyper-frequent metrics and industrial sensor telemetry. Features advanced downsampling, compression ratios of up to 90%, and SQL-like analytical query support for complex interval computations.",
    specs: [
      { label: "Write Throughput", value: "10M+ metrics per second" },
      { label: "Query Language", value: "ChronoSQL & PromQL support" },
      { label: "Storage Compacting", value: "Automated daily schedules" },
    ],
  },
  {
    id: "edge-gateway",
    name: "Edge Gateway",
    category: "network",
    icon: "router",
    iconColor: "text-emerald-500",
    desc: "Managed application entry point providing load balancing, TLS termination and DDoS shield.",
    price: "$0.015 / GB routed",
    bgColor: "bg-emerald-500/10",
    longDesc: "Edge Gateway provides a highly resilient, unified gateway for routing all incoming internet traffic. Integrated with enterprise-tier DDoS protections, custom domain SSL/TLS certificate issuing, and configurable smart routing rules with health checks.",
    specs: [
      { label: "SSL Handshake Time", value: "Under 10ms at Edge" },
      { label: "DDoS Mitigation", value: "Up to 2Tbps shielding" },
      { label: "Custom Domain Routing", value: "Unlimited backends" },
    ],
  },
  {
    id: "audiosynth-ai",
    name: "AudioSynth AI",
    category: "ai",
    tag: "Updated",
    tagType: "updated",
    icon: "graphic_eq",
    iconColor: "text-primary",
    desc: "Ultra-realistic text-to-speech engine and generative sound design tool.",
    price: "$0.015 / min",
    bgColor: "bg-primary/10",
    longDesc: "Create lifelike vocal performances, translate podcasts with emotional persistence, or generate unique cinematic backgrounds with AudioSynth AI. Includes over 40 standard accents and premium custom-voice cloning support via brief 10-second reference samples.",
    specs: [
      { label: "Sample Rate Output", value: "48kHz high-fidelity WAV" },
      { label: "Voice Library Size", value: "150+ premade voices" },
      { label: "Latent Response", value: "Real-time streaming (~120ms)" },
    ],
  },
  {
    id: "quantum-vm",
    name: "Quantum Core VM",
    category: "compute",
    icon: "grain",
    iconColor: "text-sky-500",
    desc: "Next-gen virtual instances designed for complex physical and molecular modeling.",
    price: "$3.50 / hr",
    bgColor: "bg-sky-500/10",
    longDesc: "Quantum Core VMs represent our highest tier of specialized computational machines. Utilizing advanced multi-threading instruction sets and liquid-cooled hardware substrates, these VMs deliver unmatched speed for molecular structural simulation, financial modeling, and cryptographic workloads.",
    specs: [
      { label: "Instruction Sets", value: "AVX-512 & AMX accelerator" },
      { label: "RAM Allocation", value: "Up to 2TB DDR5" },
      { label: "SLA Guarantee", value: "99.999% uptime" },
    ],
  },
  {
    id: "nebula-block",
    name: "Nebula Block",
    category: "storage",
    tag: "Popular",
    tagType: "popular",
    icon: "hard_drive",
    iconColor: "text-purple-500",
    desc: "Persistent solid-state block storage designed for virtual machine boot disks.",
    price: "$0.08 / GB-month",
    bgColor: "bg-purple-500/10",
    longDesc: "Nebula Block provides ultra-fast, network-attached SSD disks with fully configurable IOPS allocation. Perfect for booting systems quickly, running read-intensive databases, or serving complex operational file systems with automated hourly block-level snapshots.",
    specs: [
      { label: "Max IOPS", value: "Up to 256,000 IOPS" },
      { label: "Throughput Limit", value: "1,200 MB/s per volume" },
      { label: "Snapshot System", value: "Incremental, background-scheduled" },
    ],
  },
  {
    id: "secure-vpn",
    name: "Secure VPN Tunnel",
    category: "network",
    icon: "vpn_key",
    iconColor: "text-emerald-500",
    desc: "Highly-encrypted private tunnels to safely link multi-region VPC instances together.",
    price: "$0.05 / connection-hr",
    bgColor: "bg-emerald-500/10",
    longDesc: "Establish impenetrable tunnels between on-premise infrastructure and your cloud private VPCs. Employs modern WireGuard protocols to maintain incredibly low performance overhead while preserving top-tier packet security, zero-knowledge logging, and dynamic traffic routing.",
    specs: [
      { label: "Protocol Base", value: "WireGuard & OpenVPN" },
      { label: "Throughput Capacity", value: "10 Gbps per tunnel" },
      { label: "Log Policy", value: "Strict zero-knowledge audit" },
    ],
  },
  {
    id: "autotranslate-ai",
    name: "AutoTranslate AI",
    category: "ai",
    icon: "translate",
    iconColor: "text-primary",
    desc: "Context-aware document and stream translator supporting over 140 languages.",
    price: "$10.00 / million chars",
    bgColor: "bg-primary/10",
    longDesc: "Translate complex technical documentation, legal agreements, and real-time support chats with absolute confidence. AutoTranslate AI parses local idioms, slang, and technical terminology to preserve context, tone, and formatting constraints across global pipelines.",
    specs: [
      { label: "Language Catalog", value: "142 fully supported languages" },
      { label: "Doc Formats", value: "PDF, Office, HTML, Markdown" },
      { label: "API Latency", value: "Average under 85ms" },
    ],
  },
  {
    id: "edge-compute",
    name: "Edge Compute Units",
    category: "compute",
    tag: "New",
    tagType: "new",
    icon: "cell_tower",
    iconColor: "text-sky-500",
    desc: "Serverless function execution right at the user's geographical point of ingress.",
    price: "$0.15 / million execution",
    bgColor: "bg-sky-500/10",
    longDesc: "Edge Compute Units let you deploy standard lightweight JavaScript or WASM snippets directly to over 150 edge nodes globally. Process user authentication, dynamically rewrite headers, check session states, and load configurations closer to your end-users with single-digit millisecond latency.",
    specs: [
      { label: "Max Memory", value: "128MB per runtime" },
      { label: "Cold Start Uptime", value: "Zero (Instant run)" },
      { label: "Standard Support", value: "Node, Bun, Rust-WASM" },
    ],
  },
  {
    id: "object-stream",
    name: "Object Stream Store",
    category: "storage",
    icon: "cloud_sync",
    iconColor: "text-purple-500",
    desc: "Low-latency streaming object directory built for heavy video and file ingestion.",
    price: "$0.012 / GB-month",
    bgColor: "bg-purple-500/10",
    longDesc: "Object Stream Store is designed to absorb colossal file payloads with simultaneous multi-part file chunks. Ideal for backing video-on-demand services, surveillance systems, dynamic media libraries, and machine learning pipelines that read large raw asset packs directly.",
    specs: [
      { label: "Multipart Upload", value: "Supported natively" },
      { label: "Read Latency", value: "Sub-15ms globally" },
      { label: "Access Standard", value: "HTTP/3 and gRPC" },
    ],
  },
  {
    id: "load-balancer",
    name: "Load Balancer Plus",
    category: "network",
    icon: "account_tree",
    iconColor: "text-emerald-500",
    desc: "Intelligent Layer-7 load balancing with smart weighted traffic distribution rules.",
    price: "$0.025 / hr",
    bgColor: "bg-emerald-500/10",
    longDesc: "Distribute incoming client requests evenly across your active compute pools. Automatically detect unhealthy backend instances, swap healthy nodes in real time, and implement advanced canary releases or green-blue deployments using intuitive percent-weighted routing configs.",
    specs: [
      { label: "Supported Protocols", value: "HTTP, HTTPS, HTTP/2, gRPC, TCP, UDP" },
      { label: "Health-check Period", value: "Down to 1 second" },
      { label: "IP Persistence", value: "Supported via cookies" },
    ],
  },
  {
    id: "code-copilot",
    name: "CodeCopilot AI",
    category: "ai",
    tag: "Popular",
    tagType: "popular",
    icon: "terminal",
    iconColor: "text-primary",
    desc: "AI coding companion built to assist developers write high-quality code in real-time.",
    price: "$19.00 / seat-month",
    bgColor: "bg-primary/10",
    longDesc: "Integrate a world-class coding AI right into your IDE. CodeCopilot suggests full multi-line code implementations, documents complex function blocks, detects security vulnerabilities, and builds high-quality unit tests dynamically as you type.",
    specs: [
      { label: "IDE Extensions", value: "VS Code, JetBrains, Vim/NeoVim" },
      { label: "Languages", value: "TS, JS, Python, Go, Rust, Java, C++" },
      { label: "Audit Standards", value: "OWASP Top 10 automated check" },
    ],
  },
  {
    id: "dedicated-bare",
    name: "BareMetal Server",
    category: "compute",
    icon: "dns",
    iconColor: "text-sky-500",
    desc: "Raw, unvirtualized hardware servers dedicated strictly to high-security systems.",
    price: "$1.85 / hr",
    bgColor: "bg-sky-500/10",
    longDesc: "For systems requiring maximum raw performance without virtualization hypervisor overhead. Our BareMetal servers offer direct access to state-of-the-art server hardware, high-performance network lanes, and local hardware disk arrays with custom operating system control.",
    specs: [
      { label: "CPU Core Range", value: "64 to 256 physical cores" },
      { label: "Root Access", value: "Full IPMI & serial console" },
      { label: "Network Bandwidth", value: "Dedicated 100 Gbps port" },
    ],
  },
  {
    id: "aurora-sql",
    name: "Relational Aurora SQL",
    category: "storage",
    tag: "Updated",
    tagType: "updated",
    icon: "dataset",
    iconColor: "text-purple-500",
    desc: "Fully-managed serverless Postgres-compatible relational database with global sync.",
    price: "$0.10 / core-hr",
    bgColor: "bg-purple-500/10",
    longDesc: "Aurora SQL gives you the scale of cloud databases with the absolute familiarity and strict consistency of standard PostgreSQL. Automatically scales computational allocations based on live queries, and maintains read-replicas across three separate geographic regions.",
    specs: [
      { label: "Postgres Compatibility", value: "Full PostgreSQL 16+ support" },
      { label: "Storage Autoscaling", value: "Up to 128TB per instance" },
      { label: "Read-Replication Uptime", value: "Average under 20ms sync lag" },
    ],
  },
  {
    id: "anycast-dns",
    name: "Anycast Traffic DNS",
    category: "network",
    icon: "language",
    iconColor: "text-emerald-500",
    desc: "Lightning-fast domain registration and DNS hosting utilizing worldwide distributed Anycast nodes.",
    price: "$0.40 / million requests",
    bgColor: "bg-emerald-500/10",
    longDesc: "Get your domain resolved instantly. Our global Anycast network coordinates query traffic across multiple geographic positions to minimize response times, bypass regional network congestion, and defend against targeted domain resolution attacks.",
    specs: [
      { label: "Propagation Speed", value: "Global change in under 60 seconds" },
      { label: "DDoS Mitigation", value: "Always-on automated defense" },
      { label: "API Configuration", value: "REST and Terraform provider" },
    ],
  },
  {
    id: "deepmind-agent",
    name: "DeepMind Agent",
    category: "ai",
    tag: "New",
    tagType: "new",
    icon: "smart_toy",
    iconColor: "text-primary",
    desc: "Autonomous smart agents designed to operate complex multi-step browser workflows.",
    price: "$0.08 / step run",
    bgColor: "bg-primary/10",
    longDesc: "Deploy intelligent virtual workers capable of using external software systems, browsing documentation, extracting data from internal corporate dashboards, executing terminal scripts, and automating repetitive business operations safely with natural language prompts.",
    specs: [
      { label: "Max Run Duration", value: "Up to 3 hours per agent run" },
      { label: "Security Layer", value: "Isolated secure sandbox container" },
      { label: "Integration", value: "Webhooks, Slack, API triggers" },
    ],
  },
  {
    id: "micro-k8s",
    name: "MicroContainer Cluster",
    category: "compute",
    icon: "grid_view",
    iconColor: "text-sky-500",
    desc: "Fully managed, auto-repairing Kubernetes nodes designed for lightweight microservices.",
    price: "$0.09 / cluster-hr",
    bgColor: "bg-sky-500/10",
    longDesc: "Our managed MicroContainer clusters remove the complex burden of deploying and operating container networks. Simply point us to your Docker image definitions, configure ingress routes, and let our auto-repairing system manage scaling, node recycling, and zero-downtime updates.",
    specs: [
      { label: "Control Plane", value: "Fully managed and highly available" },
      { label: "Node Auto-healing", value: "Enabled by default" },
      { label: "Ingress Integration", value: "Integrated with Mesh Network" },
    ],
  },
  {
    id: "redis-cache",
    name: "In-Memory Cache (Redis)",
    category: "storage",
    icon: "speed",
    iconColor: "text-purple-500",
    desc: "Ultra-fast Redis databases optimized for session storage and frequent database query caching.",
    price: "$0.03 / GB-hr",
    bgColor: "bg-purple-500/10",
    longDesc: "Supercharge your application speeds by storing dynamic session details, rate limiting states, and heavy database query results directly in blazing-fast managed memory clusters. Fully compatible with native Redis commands, pub/sub architecture, and persistence modes.",
    specs: [
      { label: "Read Response Latency", value: "Sub-millisecond guaranteed" },
      { label: "Clustering Options", value: "Up to 10 shard nodes" },
      { label: "Encryption", value: "TLS-encrypted in transit and rest" },
    ],
  },
  {
    id: "cdn-express",
    name: "CDN Express",
    category: "network",
    tag: "Popular",
    tagType: "popular",
    icon: "bolt",
    iconColor: "text-emerald-500",
    desc: "Ultra-fast asset delivery pipeline with automatic image optimization and instant cache purges.",
    price: "$0.05 / GB delivered",
    bgColor: "bg-emerald-500/10",
    longDesc: "Instantly stream static resources, media, and fonts to your global users. CDN Express automatically compresses images into next-gen formats, pre-gzip streams, and provides an API-first cache purging engine that executes across all edge nodes in under 150 milliseconds.",
    specs: [
      { label: "Cache Purge Speed", value: "Under 150ms globally" },
      { label: "Media Optimization", value: "Auto-WebP and progressive format" },
      { label: "HTTP Version", value: "Full HTTP/3 native fallback" },
    ],
  }
];

const getProductImage = (product: { id: string; category: string }) => {
  if (product.category === "ai") {
    if (product.id === "nexus-ai") return "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop";
    if (product.id === "vision-ai") return "https://images.unsplash.com/photo-1527474305487-b87b222841cc?q=80&w=400&auto=format&fit=crop";
    if (product.id === "audiosynth-ai") return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop";
    if (product.id === "autotranslate-ai") return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop";
  } else if (product.category === "compute") {
    if (product.id === "aero-compute") return "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?q=80&w=400&auto=format&fit=crop";
    if (product.id === "tensor-tpu") return "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop";
    if (product.id === "quantum-vm") return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=400&auto=format&fit=crop";
  } else if (product.category === "storage") {
    if (product.id === "glacier-storage") return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400&auto=format&fit=crop";
    if (product.id === "chrono-db") return "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=400&auto=format&fit=crop";
    if (product.id === "nebula-block") return "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=400&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1563770660941-20978e870e26?q=80&w=400&auto=format&fit=crop";
  } else if (product.category === "network") {
    if (product.id === "mesh-network") return "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=400&auto=format&fit=crop";
    if (product.id === "edge-gateway") return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop";
    if (product.id === "secure-vpn") return "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop";
  }
  return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop";
};

const getProductVNDDetails = (id: string) => {
  const mappings: Record<string, { present: string; old: string; discount: string; smember: string }> = {
    "nexus-ai": { present: "12.500.000đ", old: "14.000.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 125.000đ" },
    "aero-compute": { present: "33.890.000đ", old: "34.990.000đ", discount: "Giảm 3%", smember: "Smember giảm đến 339.000đ" },
    "glacier-storage": { present: "450.000đ", old: "500.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 15.000đ" },
    "mesh-network": { present: "2.150.000đ", old: "2.500.000đ", discount: "Giảm 14%", smember: "Smember giảm đến 50.000đ" },
    "vision-ai": { present: "8.900.000đ", old: "9.900.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 99.000đ" },
    "tensor-tpu": { present: "48.990.000đ", old: "52.000.000đ", discount: "Giảm 5%", smember: "Smember giảm đến 489.000đ" },
    "chrono-db": { present: "15.200.000đ", old: "16.500.000đ", discount: "Giảm 7%", smember: "Smember giảm đến 150.000đ" },
    "edge-gateway": { present: "3.600.000đ", old: "4.000.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 36.000đ" },
    "audiosynth-ai": { present: "7.200.000đ", old: "8.000.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 72.000đ" },
    "quantum-vm": { present: "29.500.000đ", old: "32.000.000đ", discount: "Giảm 8%", smember: "Smember giảm đến 295.000đ" },
    "nebula-block": { present: "5.800.000đ", old: "6.500.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 58.000đ" },
    "secure-vpn": { present: "1.150.000đ", old: "1.300.000đ", discount: "Giảm 11%", smember: "Smember giảm đến 15.000đ" },
    "autotranslate-ai": { present: "4.900.000đ", old: "5.500.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 49.000đ" },
    "edge-compute": { present: "6.350.000đ", old: "6.800.000đ", discount: "Giảm 6%", smember: "Smember giảm đến 63.000đ" },
    "object-stream": { present: "2.890.000đ", old: "3.200.000đ", discount: "Giảm 9%", smember: "Smember giảm đến 28.000đ" },
    "load-balancer": { present: "9.500.000đ", old: "10.500.000đ", discount: "Giảm 9%", smember: "Smember giảm đến 95.000đ" },
    "code-copilot": { present: "4.120.000đ", old: "4.500.000đ", discount: "Giảm 8%", smember: "Smember giảm đến 41.000đ" },
    "dedicated-bare": { present: "85.900.000đ", old: "90.000.000đ", discount: "Giảm 5%", smember: "Smember giảm đến 859.000đ" },
    "aurora-sql": { present: "18.600.000đ", old: "20.000.000đ", discount: "Giảm 7%", smember: "Smember giảm đến 186.000đ" }
  };

  return mappings[id] || { present: "5.000.000đ", old: "5.500.000đ", discount: "Giảm 10%", smember: "Smember giảm đến 50.000đ" };
};

const getProductHashSku = (product: Product) => {
  return product.specs.find((spec) => spec.label === "Mã SKU Sản phẩm")?.value || product.id;
};

interface ProductPageProps {
  onAddToCart?: (
    itemName: string,
    itemPrice: string,
    clickEvent?: React.MouseEvent | { clientX: number; clientY: number }
  ) => void;
  onNavigate?: (page: "landing" | "product" | "auth-report" | "profile" | "register") => void;
  onFlyEffect?: (
    startX: number,
    startY: number,
    icon: string,
    color?: string,
    shadowColor?: string
  ) => void;
  onSpawnStars?: (x: number, y: number, color: string) => void;
  onFlyToAccount?: (
    startX: number,
    startY: number,
    icon?: string,
    color?: string,
    shadowColor?: string
  ) => void;
}

export default function ProductPage({ onAddToCart, onNavigate, onFlyEffect, onSpawnStars, onFlyToAccount }: ProductPageProps) {
  const [viewMode, setViewMode] = useState<"cloud" | "erp">("cloud");
  const [gatewayUrl, setGatewayUrl] = useState(() => localStorage.getItem("horizon_api_base_url") || "https://mummified-escapable-proven.ngrok-free.dev");
  const [erpProducts, setErpProducts] = useState<ErpProduct[]>([]);
  const [erpCategories, setErpCategories] = useState<ErpCategory[]>([]);
  const [erpAttributes, setErpAttributes] = useState<ErpAttribute[]>([]);
  const [erpLoading, setErpLoading] = useState(false);
  const [erpError, setErpError] = useState<string | null>(null);
  const [erpRefreshTrigger, setErpRefreshTrigger] = useState(0);
  const [erpPriceFilter, setErpPriceFilter] = useState<"all" | "under1m" | "1to5m" | "over5m">("all");
  const [erpStockFilter, setErpStockFilter] = useState<"all" | "available" | "outofstock">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const selectedErpCategorySku = activeCategory === "all"
    ? undefined
    : erpCategories.find((category) => category.name === activeCategory)?.skuInfo?.sku;

  useEffect(() => {
    if (viewMode === "erp") {
      let cancelled = false;
      setErpLoading(true);
      setErpError(null);

      loadErpCatalog({
        keyword: searchQuery,
        categorySku: selectedErpCategorySku
      })
        .then(({ categories, products, attributes }) => {
          if (cancelled) return;
          setErpCategories(categories);
          setErpProducts(products);
          setErpAttributes(attributes);
        })
        .catch((error) => {
          if (cancelled) return;
          setErpError(error instanceof Error ? error.message : "Không thể tải danh mục ERP.");
        })
        .finally(() => {
          if (!cancelled) setErpLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [viewMode, erpRefreshTrigger, searchQuery, selectedErpCategorySku]);

  // Automatically select/open a product if there is a 'sku' query parameter in the URL on load or when lists load
  useEffect(() => {
    if (viewMode === "erp" && erpProducts.length > 0 && erpAttributes.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const hashSku = decodeURIComponent(window.location.hash.slice(1).trim());
      const skuParam = params.get("sku") || hashSku;
      if (skuParam) {
        // Find matching attribute in ERP data
        const matchedAttr = erpAttributes.find(a => a.sku?.sku?.toLowerCase() === skuParam.toLowerCase());
        if (matchedAttr) {
          const parentProductId = getAttributeProductId(matchedAttr);
          const parentProduct = erpProducts.find(p => p.id === parentProductId);
          if (parentProduct && (!selectedProduct || selectedProduct.id !== parentProduct.id)) {
            handleSelectErpProduct(parentProduct);
          }
        }
      }
    }
  }, [viewMode, erpProducts, erpAttributes]);

  useEffect(() => {
    const hashSku = decodeURIComponent(window.location.hash.slice(1).trim());
    if (!hashSku || selectedProduct || viewMode === "erp") return;

    const matchedProduct = PRODUCTS.find((product) => getProductHashSku(product).toLowerCase() === hashSku.toLowerCase());
    if (matchedProduct) {
      setSelectedProduct(matchedProduct);
    }
  }, [selectedProduct, viewMode]);

  const handleSelectErpProduct = (p: ErpProduct) => {
    setSelectedProduct(createErpProductDetail(p, erpAttributes));
  };

  // Advanced search options and attributes states
  const [selectedPricingModel, setSelectedPricingModel] = useState<"all" | "hourly" | "usage">("all");
  const [selectedGPU, setSelectedGPU] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState(false);
  const [selectedLatency, setSelectedLatency] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  // CellphoneS-style custom states for premium catalog experience
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"banchay" | "giathap" | "giacao" | "khuyenmai" | "xemnhieu">("banchay");
  const [comparedProductIds, setComparedProductIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const comparedProducts = comparedProductIds.map(id => PRODUCTS.find(p => p.id === id)).filter((p): p is Product => !!p);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "warning" }[]>([]);
  const [countdownTime, setCountdownTime] = useState({ hours: 4, minutes: 25, seconds: 12 });

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const getProductBrand = (id: string): string => {
    if (id.includes("nexus") || id.includes("code-copilot") || id.includes("audiosynth")) return "OpenAI";
    if (id.includes("tensor") || id.includes("vision") || id.includes("aurora")) return "Google Cloud";
    if (id.includes("quantum") || id.includes("glacier") || id.includes("dedicated-bare")) return "AWS";
    if (id.includes("mesh") || id.includes("edge") || id.includes("cdn")) return "Cloudflare";
    if (id.includes("aero") || id.includes("compute")) return "NVIDIA";
    if (id.includes("secure-vpn")) return "Azure";
    return "Horizon";
  };

  const BRANDS = [
    { name: "AWS", logo: "☁️ AWS" },
    { name: "Google Cloud", logo: "🪐 Google" },
    { name: "Azure", logo: "⚡ Azure" },
    { name: "NVIDIA", logo: "🟢 NVIDIA" },
    { name: "OpenAI", logo: "🧠 OpenAI" },
    { name: "Cloudflare", logo: "🟠 Cloudflare" },
    { name: "Meta AI", logo: "♾️ Meta" },
    { name: "Horizon", logo: "💫 Horizon" }
  ];

  const BANNERS = [
    {
      title: "Aero GPU Server & AI Platform",
      desc: "Cung cấp cụm máy chủ ảo thế hệ mới tăng tốc mô hình trí tuệ nhân tạo, tiết kiệm tối ưu đến 40% chi phí vận hành với độ trễ cực thấp.",
      sub: "HOT SALE • NHẬN $50 FREE CREDIT",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
      badge: "HOT SALE"
    },
    {
      title: "Nexus AI Model fine-tuning",
      desc: "Tải lên tệp huấn luyện và tinh chỉnh mô hình Nexus AI chuyên dụng cho doanh nghiệp với cấu hình vGPU H100 chuyên biệt.",
      sub: "ĐẶC QUYỀN DOANH NGHIỆP • GIẢM 15%",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop",
      badge: "GIẢM 15%"
    },
    {
      title: "Glacier S3 Object Storage",
      desc: "Hệ thống lưu trữ lạnh siêu bền bỉ với thời gian hoạt động cam kết SLA 99.999999999%. Trích xuất nhanh chóng dưới 5 phút.",
      sub: "ĐỘ BỀN 11 NINES • CHỈ TỪ $0.004/GB",
      image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1200&auto=format&fit=crop",
      badge: "BỀN BỈ 100%"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownTime(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(bannerTimer);
  }, []);

  const getCategoryCount = (cat: string) => {
    if (viewMode === "erp") {
      return getErpCategoryCount(cat, erpProducts);
    } else {
      if (cat === "all") return PRODUCTS.length;
      return PRODUCTS.filter((p) => p.category === cat).length;
    }
  };

  // Intercept browser back/mouse back button to close the product details modal
  useEffect(() => {
    if (selectedProduct) {
      const sku = getProductHashSku(selectedProduct);
      const encodedSku = encodeURIComponent(sku);
      if (window.location.hash !== `#${encodedSku}`) {
        window.history.pushState({ modal: "product-detail", sku }, "", `/p#${encodedSku}`);
      }

      const handlePopState = (event: PopStateEvent) => {
        setSelectedProduct(null);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [selectedProduct]);

  // Filter products dynamically based on search query, categories, and advanced attributes/specs
  const filteredProducts = viewMode === "erp"
    ? []
    : PRODUCTS.filter((product) => {
        // 1. Category filter
        const matchesCategory = activeCategory === "all" || product.category === activeCategory;

        // 1.1 Brand filter
        const matchesBrand = !selectedBrand || getProductBrand(product.id) === selectedBrand;

        // 2. Search query matching name, description, long description, category, tag, or specs
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query ||
          product.name.toLowerCase().includes(query) ||
          product.desc.toLowerCase().includes(query) ||
          product.longDesc.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.tag && product.tag.toLowerCase().includes(query)) ||
          product.specs.some(spec => 
            spec.label.toLowerCase().includes(query) ||
            spec.value.toLowerCase().includes(query)
          );

        // 3. Pricing model filter (Hourly vs Usage-based)
        const isHourly = product.price.toLowerCase().includes("hr") || product.id.includes("compute") || product.id.includes("tpu");
        const matchesPricingModel = 
          selectedPricingModel === "all" ||
          (selectedPricingModel === "hourly" && isHourly) ||
          (selectedPricingModel === "usage" && !isHourly);

        // 4. Attribute filters
        const matchesGPU = !selectedGPU || product.specs.some(s => s.label.toLowerCase().includes("gpu") || s.value.toLowerCase().includes("gpu") || s.label.toLowerCase().includes("flops") || product.name.toLowerCase().includes("tpu") || product.name.toLowerCase().includes("compute"));
        const matchesSLA = !selectedSLA || product.specs.some(s => s.label.toLowerCase().includes("sla") || s.value.toLowerCase().includes("sla") || s.value.toLowerCase().includes("99."));
        const matchesLatency = !selectedLatency || product.specs.some(s => s.label.toLowerCase().includes("latency") || s.label.toLowerCase().includes("time") || s.value.toLowerCase().includes("ms") || product.longDesc.toLowerCase().includes("latency") || product.longDesc.toLowerCase().includes("instantaneous"));

        // 5. Service Tags filter
        const matchesTags = selectedTags.length === 0 || (product.tag && selectedTags.includes(product.tag));

        return matchesCategory && matchesBrand && matchesSearch && matchesPricingModel && matchesGPU && matchesSLA && matchesLatency && matchesTags;
      });

  const sortedFilteredProducts = viewMode === "erp"
    ? getSortedErpProducts(erpProducts, erpAttributes, {
        activeCategory,
        searchQuery,
        erpPriceFilter,
        erpStockFilter,
        sortBy
      })
    : [...filteredProducts].sort((a, b) => {
        const priceA = parseInt(getProductVNDDetails(a.id).present.replace(/\./g, "").replace("đ", ""), 10) || 0;
        const priceB = parseInt(getProductVNDDetails(b.id).present.replace(/\./g, "").replace("đ", ""), 10) || 0;

        const discountPctA = parseInt(getProductVNDDetails(a.id).discount.replace(/\D/g, ""), 10) || 0;
        const discountPctB = parseInt(getProductVNDDetails(b.id).discount.replace(/\D/g, ""), 10) || 0;

        if (sortBy === "giathap") {
          return priceA - priceB;
        }
        if (sortBy === "giacao") {
          return priceB - priceA;
        }
        if (sortBy === "khuyenmai") {
          return discountPctB - discountPctA; // sort by highest discount %
        }
        if (sortBy === "xemnhieu") {
          return b.name.length - a.name.length;
        }
        // banchay (default): mock popularity ordering
        const order = ["nexus-ai", "tensor-tpu", "aero-compute", "glacier-storage", "mesh-network"];
        const idxA = order.indexOf(a.id);
        const idxB = order.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });

  const [voucher1Collected, setVoucher1Collected] = useState(false);
  const [voucher2Collected, setVoucher2Collected] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const handleReset = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setActiveTag(null);
    setSelectedPricingModel("all");
    setSelectedGPU(false);
    setSelectedSLA(false);
    setSelectedLatency(false);
    setSelectedTags([]);
    setErpPriceFilter("all");
    setErpStockFilter("all");
  };

  // Preset filter tags tailored for the High-End Cloud/AI platform
  const PRESET_TAGS = [
    { label: "GPU Cloud", search: "GPU" },
    { label: "S3 Storage", search: "S3" },
    { label: "AI Models", search: "AI" },
    { label: "Low Latency", search: "ms" },
    { label: "High SLA", search: "SLA" },
    { label: "WASM Edge", search: "WASM" }
  ];

  const categoryItems = viewMode === "erp"
    ? [
        { id: "all", label: "Tất cả vật tư", icon: BoxesIcon },
        ...erpCategories.map((category) => ({
          id: category.name,
          label: category.name === "Electronics"
            ? "Thiết bị điện tử"
            : category.name === "Clothing"
              ? "Thời trang"
              : "Gia dụng",
          icon: BoxesIcon,
        })),
      ]
    : [
        { id: "all", label: "Tất cả", icon: Grid2X2Icon },
        { id: "ai", label: "AI Models", icon: BrainCircuitIcon },
        { id: "compute", label: "GPU VM", icon: ServerIcon },
        { id: "storage", label: "S3 Storage", icon: DatabaseIcon },
        { id: "network", label: "Edge CDN", icon: NetworkIcon },
      ];

  const sortItems = [
    { id: "banchay", label: "Bán chạy", icon: TrendingUpIcon },
    { id: "giathap", label: "Giá thấp", icon: TrendingDownIcon },
    { id: "giacao", label: "Giá cao", icon: TrendingUpIcon },
    { id: "khuyenmai", label: "Sale hot", icon: GiftIcon },
    { id: "xemnhieu", label: "Xem nhiều", icon: SparklesIcon },
  ];

  const searchSuggestions = viewMode === "erp"
    ? [
        { query: "Smartphone", label: "Điện thoại" },
        { query: "Laptop", label: "Laptop" },
        { query: "T-Shirt", label: "Áo thun" },
      ]
    : [
        { query: "GPU", label: "GPU Cloud" },
        { query: "SLA", label: "SLA 99.99%" },
        { query: "AI", label: "AI Models" },
      ];

  const isAnyFilterActive =
    searchQuery !== "" ||
    activeCategory !== "all" ||
    selectedBrand !== null ||
    selectedPricingModel !== "all" ||
    selectedGPU ||
    selectedSLA ||
    selectedLatency ||
    selectedTags.length > 0 ||
    erpPriceFilter !== "all" ||
    erpStockFilter !== "all";

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-24 text-foreground sm:px-6 md:pt-[100px]">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <Card className="overflow-hidden py-0">
          <section className="relative min-h-[430px] overflow-hidden rounded-xl bg-zinc-950 text-white sm:min-h-[460px] lg:min-h-[500px]">
            <AnimatePresence initial={false}>
              <motion.div
                key={activeBannerIdx}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.08, x: 80 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 1.02, x: -80 }}
                transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src={BANNERS[activeBannerIdx]?.image}
                  alt={BANNERS[activeBannerIdx]?.title}
                  className="absolute inset-0 size-full object-cover brightness-[0.82] contrast-125 saturate-125"
                  referrerPolicy="no-referrer"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/5" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="relative flex min-h-[430px] flex-col justify-end p-5 sm:min-h-[460px] sm:p-7 lg:min-h-[500px] lg:p-9">
                  <div className="flex max-w-3xl flex-col gap-3 pb-3">
                    <div className="w-fit rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-950">
                      {BANNERS[activeBannerIdx]?.badge}
                    </div>
                    <h1 className="max-w-3xl font-heading text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-6xl">
                      {BANNERS[activeBannerIdx]?.title}
                    </h1>
                    <p className="max-w-2xl text-base font-medium leading-7 text-white/80 sm:text-lg">
                      {BANNERS[activeBannerIdx]?.sub}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2">
              {BANNERS.map((banner, index) => (
                <button
                  key={banner.title}
                  className={index === activeBannerIdx ? "h-1.5 w-8 rounded-full bg-white" : "size-1.5 rounded-full bg-white/45"}
                  aria-label={`Chuyển poster ${index + 1}`}
                  onClick={() => setActiveBannerIdx(index)}
                />
              ))}
            </div>
          </section>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilterIcon />
                  Bộ lọc
                </CardTitle>
                <CardDescription>Thu hẹp catalog theo nhu cầu triển khai.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Tabs
                  value={viewMode}
                  onValueChange={(value) => {
                    setViewMode(value as "cloud" | "erp");
                    setActiveCategory("all");
                  }}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="cloud">Cloud</TabsTrigger>
                    <TabsTrigger value="erp">ERP</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cloud" className="sr-only">Cloud catalog</TabsContent>
                  <TabsContent value="erp" className="sr-only">ERP catalog</TabsContent>
                </Tabs>

                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 160)}
                    className="pl-8 pr-8"
                    placeholder="Tìm sản phẩm, SLA, GPU..."
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setSearchQuery("")}
                    >
                      <XIcon />
                    </Button>
                  )}
                  {isSearchFocused && (
                    <Card className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-visible p-2 shadow-md">
                      <div className="flex flex-wrap gap-1">
                        {searchSuggestions.map((suggestion) => (
                          <Button
                            key={suggestion.query}
                            variant="outline"
                            size="xs"
                            onMouseDown={() => {
                              setSearchQuery(suggestion.query);
                              setIsSearchFocused(false);
                            }}
                          >
                            {suggestion.label}
                          </Button>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-muted-foreground">Danh mục</div>
                  <div className="flex flex-col gap-1">
                    {categoryItems.map((category) => {
                      const Icon = category.icon;
                      const isActive = activeCategory === category.id;
                      return (
                        <Button
                          key={category.id}
                          variant={isActive ? "default" : "ghost"}
                          className="justify-between"
                          onClick={() => setActiveCategory(category.id)}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon data-icon="inline-start" />
                            {category.label}
                          </span>
                          <Badge variant={isActive ? "secondary" : "outline"}>{getCategoryCount(category.id)}</Badge>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {viewMode === "cloud" ? (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-medium text-muted-foreground">Hãng hạ tầng</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={selectedBrand === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedBrand(null)}
                        >
                          Tất cả
                        </Button>
                        {BRANDS.slice(0, 7).map((brand) => (
                          <Button
                            key={brand.name}
                            variant={selectedBrand === brand.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedBrand(brand.name)}
                          >
                            <span className="truncate">{brand.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        className="justify-between px-0"
                        onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <SlidersHorizontalIcon data-icon="inline-start" />
                          Bộ lọc nâng cao
                        </span>
                        <ChevronRightIcon data-icon="inline-end" className={isAdvancedExpanded ? "rotate-90" : ""} />
                      </Button>
                      {isAdvancedExpanded && (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "all", label: "Tất cả" },
                              { id: "hourly", label: "Theo giờ" },
                              { id: "usage", label: "Lưu lượng" },
                            ].map((item) => (
                              <Button
                                key={item.id}
                                variant={selectedPricingModel === item.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedPricingModel(item.id as any)}
                              >
                                {item.label}
                              </Button>
                            ))}
                          </div>
                          {[
                            { key: "gpu", active: selectedGPU, label: "GPU Boost", setter: setSelectedGPU, icon: ServerIcon },
                            { key: "sla", active: selectedSLA, label: "SLA 99.99%+", setter: setSelectedSLA, icon: ShieldCheckIcon },
                            { key: "latency", active: selectedLatency, label: "Độ trễ thấp", setter: setSelectedLatency, icon: ZapIcon },
                          ].map((item) => {
                            const Icon = item.icon;
                            return (
                              <Button
                                key={item.key}
                                variant={item.active ? "default" : "outline"}
                                className="justify-start"
                                onClick={() => item.setter(!item.active)}
                              >
                                <Icon data-icon="inline-start" />
                                {item.label}
                              </Button>
                            );
                          })}
                          <div className="flex flex-wrap gap-2">
                            {["New", "Popular", "Updated"].map((tag) => (
                              <Button
                                key={tag}
                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setSelectedTags(
                                    selectedTags.includes(tag)
                                      ? selectedTags.filter((item) => item !== tag)
                                      : [...selectedTags, tag]
                                  );
                                }}
                              >
                                {tag === "Popular" ? "Hot" : tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-medium text-muted-foreground">ERP</div>
                      <Select
                        items={[
                          { label: "Tất cả mức giá", value: "all" },
                          { label: "Dưới 1.000.000đ", value: "under1m" },
                          { label: "1.000.000đ - 5.000.000đ", value: "1to5m" },
                          { label: "Trên 5.000.000đ", value: "over5m" },
                        ]}
                        value={erpPriceFilter}
                        onValueChange={(value) => setErpPriceFilter(value as any)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {[
                              { label: "Tất cả mức giá", value: "all" },
                              { label: "Dưới 1.000.000đ", value: "under1m" },
                              { label: "1.000.000đ - 5.000.000đ", value: "1to5m" },
                              { label: "Trên 5.000.000đ", value: "over5m" },
                            ].map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select
                        items={[
                          { label: "Tất cả trạng thái", value: "all" },
                          { label: "Còn hàng", value: "available" },
                          { label: "Hết hàng", value: "outofstock" },
                        ]}
                        value={erpStockFilter}
                        onValueChange={(value) => setErpStockFilter(value as any)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {[
                              { label: "Tất cả trạng thái", value: "all" },
                              { label: "Còn hàng", value: "available" },
                              { label: "Hết hàng", value: "outofstock" },
                            ].map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCcwIcon data-icon="inline-start" />
                  Đặt lại
                </Button>
                <Badge variant="secondary">{sortedFilteredProducts.length} sản phẩm</Badge>
              </CardFooter>
            </Card>

            <Card id="voucher-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GiftIcon />
                  Voucher
                </CardTitle>
                <CardDescription>Mã ưu đãi cho hóa đơn cloud.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {[
                  { id: "HORIZONNEW", title: "Thành viên mới", desc: "Giảm 10%, tối đa 500K", collected: voucher1Collected, setCollected: setVoucher1Collected },
                  { id: "HORIZONGPU", title: "Khởi tạo vGPU", desc: "Tặng 200K tín dụng cấu hình", collected: voucher2Collected, setCollected: setVoucher2Collected },
                ].map((voucher) => (
                  <div key={voucher.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="min-w-0">
                      <div className="font-medium">{voucher.title}</div>
                      <div className="text-xs text-muted-foreground">{voucher.desc}</div>
                      <div className="mt-1 font-mono text-xs">{voucher.id}</div>
                    </div>
                    <Button
                      size="sm"
                      variant={voucher.collected ? "secondary" : "default"}
                      disabled={voucher.collected}
                      onClick={(event) => {
                        voucher.setCollected(true);
                        showToast(`Nhận mã ${voucher.id} thành công!`, "success");
                        onSpawnStars?.(event.clientX, event.clientY, "#111111");
                        onFlyToAccount?.(event.clientX, event.clientY, "🎟️", "#111111", "rgba(17,17,17,0.3)");
                      }}
                    >
                      {voucher.collected ? "Đã có" : "Lấy"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section className="flex min-w-0 flex-col gap-4">
            <Card size="sm">
              <CardContent>
                <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as any)} className="w-full min-w-0">
                  <TabsList className="grid w-full grid-cols-2 overflow-hidden sm:grid-cols-5">
                    {sortItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <TabsTrigger key={item.id} value={item.id}>
                          <Icon data-icon="inline-start" />
                          {item.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {sortItems.map((item) => (
                    <TabsContent key={item.id} value={item.id} className="sr-only">
                      {item.label}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {isAnyFilterActive && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && <Badge variant="secondary">"{searchQuery}"</Badge>}
                {activeCategory !== "all" && <Badge variant="secondary">{activeCategory}</Badge>}
                {selectedBrand && <Badge variant="secondary">{selectedBrand}</Badge>}
                {selectedPricingModel !== "all" && <Badge variant="secondary">{selectedPricingModel === "hourly" ? "Theo giờ" : "Lưu lượng"}</Badge>}
                {selectedGPU && <Badge variant="secondary">GPU Boost</Badge>}
                {selectedSLA && <Badge variant="secondary">SLA 99.99%+</Badge>}
                {selectedLatency && <Badge variant="secondary">Độ trễ thấp</Badge>}
                {selectedTags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            )}

            {viewMode === "erp" && erpLoading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <RefreshCcwIcon className="animate-spin text-primary" />
                  <CardTitle>Đang tải dữ liệu sản phẩm ERP</CardTitle>
                  <CardDescription>Đang gọi GraphQL gateway đã cấu hình.</CardDescription>
                </CardContent>
              </Card>
            )}

            {viewMode === "erp" && erpError && !erpLoading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Badge variant="destructive">ERP error</Badge>
                  <CardTitle>Không thể tải dữ liệu sản phẩm thật</CardTitle>
                  <CardDescription>{erpError}</CardDescription>
                </CardContent>
              </Card>
            )}

            {!erpLoading && !erpError && (
              <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                <AnimatePresence mode="popLayout">
                  {sortedFilteredProducts.map((rawProduct) => {
                    const product = rawProduct as Product & {
                      priceInfo?: ReturnType<typeof getProductVNDDetails>;
                      mediaItems?: { url: string }[];
                    };
                    const vndInfo = viewMode === "erp"
                      ? product.priceInfo || getProductVNDDetails(product.id)
                      : getProductVNDDetails(product.id);
                    const imgSrc = viewMode === "erp"
                      ? product.mediaItems?.[0]?.url || ""
                      : getProductImage(product);
                    const specs = product.specs || [];
                    const compared = comparedProductIds.includes(product.id);

                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          size="sm"
                          className="group relative h-full cursor-pointer gap-2 overflow-visible py-0 transition-shadow hover:shadow-md"
                          onClick={() => {
                            if (viewMode === "erp") {
                              handleSelectErpProduct(rawProduct as ErpProduct);
                            } else {
                              setSelectedProduct(product);
                            }
                          }}
                        >
                          {vndInfo.discount && (
                            <>
                              <div className="absolute -top-2 left-[-4px] h-[21px] bg-gradient-to-r from-[#FF4D24] to-[#FF6B35] text-white text-[9px] font-black px-1.5 rounded-br-lg rounded-tr-sm shadow-[2px_2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center z-30 select-none">
                                {vndInfo.discount}
                              </div>
                              <div className="absolute top-[13px] left-[-4px] size-1 bg-destructive z-20" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
                            </>
                          )}

                          {viewMode !== "erp" && (
                            <>
                              <div className="absolute -top-2 right-[-4px] h-[21px] bg-[#E1EBFD] text-[#2F80ED] text-[9px] font-black px-1.5 rounded-bl-lg rounded-tl-sm shadow-[-2px_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center z-30 select-none">
                                Trả góp 0%
                              </div>
                              <div className="absolute top-[13px] right-[-4px] size-1 bg-[#1d5fb5] z-20" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
                            </>
                          )}

                          <div className="aspect-[4/5] overflow-hidden rounded-t-xl bg-muted">
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={product.name}
                                className="size-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                                Chưa có ảnh từ API
                              </div>
                            )}
                          </div>

                          <CardHeader className="px-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <CardTitle className="line-clamp-2">
                                  {viewMode === "erp" ? product.name : `${product.name} Cloud Platform`}
                                </CardTitle>
                                <CardDescription className="line-clamp-1 text-xs leading-5">
                                  {product.desc || "Dịch vụ hạ tầng đã đồng bộ từ ERP."}
                                </CardDescription>
                              </div>
                              {product.tag && <Badge variant="outline">{product.tag}</Badge>}
                            </div>
                          </CardHeader>

                          <CardContent className="flex flex-1 flex-col gap-2 px-3">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-base font-medium text-primary">{vndInfo.present}</span>
                              {vndInfo.old && <span className="text-sm text-muted-foreground line-through">{vndInfo.old}</span>}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {specs.slice(0, 2).map((spec, index) => (
                                <Badge key={`${spec.label}-${index}`} variant="secondary">
                                  {spec.value.length > 22 ? `${spec.value.slice(0, 22)}...` : spec.value}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <BadgeCheckIcon />
                              <span className="truncate">{vndInfo.smember}</span>
                            </div>
                          </CardContent>

                          <CardFooter className="justify-between gap-2 bg-background px-3 py-2">
                            <div className="flex items-center gap-1.5 text-xs">
                              <StarIcon className="fill-primary text-primary" />
                              <span className="font-medium">5.0</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {viewMode !== "erp" && (
                                <Button
                                  variant={compared ? "default" : "outline"}
                                  size="icon-xs"
                                  aria-label={compared ? "Bỏ khỏi so sánh" : "So sánh sản phẩm"}
                                  title={compared ? "Bỏ khỏi so sánh" : "So sánh sản phẩm"}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (compared) {
                                      setComparedProductIds(comparedProductIds.filter((id) => id !== product.id));
                                    } else if (comparedProductIds.length >= 3) {
                                      showToast("Bạn chỉ có thể so sánh tối đa 3 sản phẩm.", "warning");
                                    } else {
                                      setComparedProductIds([...comparedProductIds, product.id]);
                                    }
                                  }}
                                >
                                  <SlidersHorizontalIcon />
                                </Button>
                              )}
                              <Button
                                size="icon-sm"
                                aria-label="Thêm vào giỏ hàng"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onAddToCart?.(
                                    viewMode === "erp" ? product.name : `${product.name} Cloud Platform`,
                                    vndInfo.present,
                                    event
                                  );
                                  showToast(`Đã thêm ${product.name} vào giỏ hàng!`, "success");
                                }}
                              >
                                <ShoppingCartIcon />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {sortedFilteredProducts.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <SearchIcon className="text-muted-foreground" />
                      <CardTitle>Không tìm thấy sản phẩm</CardTitle>
                      <CardDescription>Thử đổi từ khóa hoặc đặt lại bộ lọc.</CardDescription>
                      <Button variant="outline" onClick={handleReset}>
                        <RefreshCcwIcon data-icon="inline-start" />
                        Thiết lập lại bộ lọc
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </section>
        </div>
      </main>

      {comparedProductIds.length > 0 && (
        <Card className="fixed bottom-4 left-1/2 z-40 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 shadow-lg">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Badge>So sánh {comparedProductIds.length}/3</Badge>
              <div className="flex items-center gap-2">
                {comparedProducts.map((product) => (
                  <div key={product.id} className="relative size-10 overflow-hidden rounded-lg border bg-muted">
                    <img src={getProductImage(product)} alt={product.name} className="size-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => {
                  if (comparedProductIds.length < 2) {
                    showToast("Vui lòng chọn ít nhất 2 sản phẩm để so sánh.", "warning");
                  } else {
                    setShowCompareModal(true);
                  }
                }}
              >
                <SlidersHorizontalIcon data-icon="inline-start" />
                So sánh ngay
              </Button>
              <Button variant="ghost" onClick={() => setComparedProductIds([])}>
                Xóa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
        <DialogContent className="max-h-[86vh] max-w-5xl overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontalIcon />
              Bảng so sánh thông số
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[68vh]">
            <div className="grid min-w-[720px] grid-cols-[180px_repeat(3,minmax(160px,1fr))] text-sm">
              <div className="border-b border-r bg-muted/50 p-3 font-medium">Thông số</div>
              {comparedProducts.map((product) => (
                <div key={product.id} className="border-b border-r p-3">
                  <div className="flex items-center gap-3">
                    <img src={getProductImage(product)} alt={product.name} className="size-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{product.name}</div>
                      <div className="text-primary">{getProductVNDDetails(product.id).present}</div>
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: 3 - comparedProducts.length }).map((_, index) => (
                <div key={index} className="border-b border-r p-3 text-muted-foreground">Chưa chọn</div>
              ))}

              {[
                { label: "Phân loại", get: (p: Product) => p.category },
                { label: "Hãng", get: (p: Product) => getProductBrand(p.id) },
                { label: "Giá", get: (p: Product) => getProductVNDDetails(p.id).present },
                { label: "Đặc quyền", get: (p: Product) => getProductVNDDetails(p.id).smember },
                { label: "Thông số 1", get: (p: Product) => p.specs[0]?.value || "Tiêu chuẩn" },
                { label: "Thông số 2", get: (p: Product) => p.specs[1]?.value || "Tiêu chuẩn" },
                { label: "Thông số 3", get: (p: Product) => p.specs[2]?.value || "Tiêu chuẩn" },
              ].map((row) => (
                <React.Fragment key={row.label}>
                  <div className="border-b border-r bg-muted/30 p-3 font-medium">{row.label}</div>
                  {comparedProducts.map((product) => (
                    <div key={`${row.label}-${product.id}`} className="border-b border-r p-3">
                      {row.get(product)}
                    </div>
                  ))}
                  {Array.from({ length: 3 - comparedProducts.length }).map((_, index) => (
                    <div key={`${row.label}-${index}`} className="border-b border-r p-3 text-muted-foreground">-</div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 border-t p-4">
            <Button variant="outline" onClick={() => setComparedProductIds([])}>
              Xóa tất cả
            </Button>
            <Button onClick={() => setShowCompareModal(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed right-4 top-24 z-50 max-w-sm rounded-lg border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-md"
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? <CheckIcon className="text-primary" /> : <SparklesIcon className="text-muted-foreground" />}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => {
              setSelectedProduct(null);
              window.history.replaceState(null, "", "/p");
            }}
            onAddToCart={onAddToCart}
            onFlyEffect={onFlyEffect}
            onSpawnStars={onSpawnStars}
            onFlyToAccount={onFlyToAccount}
            viewMode={viewMode}
            gatewayUrl={gatewayUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// HIGH FIDELITY CELLPHONES STYLE SUB-COMPONENTS & HELPERS
// ==========================================

const getProductImagesList = (product: Product, allowFallback = true) => {
  if (product.mediaUrls && product.mediaUrls.length > 0) {
    return product.mediaUrls;
  }
  if (!allowFallback) {
    return [];
  }
  const primaryImg = getProductImage(product);
  if (product.category === "ai") {
    return [
      primaryImg,
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop",
    ];
  } else if (product.category === "compute") {
    return [
      primaryImg,
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=400&auto=format&fit=crop",
    ];
  } else if (product.category === "storage") {
    return [
      primaryImg,
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?q=80&w=400&auto=format&fit=crop",
    ];
  } else {
    return [
      primaryImg,
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop",
    ];
  }
};

const getProductVersions = (product: Product) => {
  if (product.category === "ai") {
    return [
      { id: "v1", title: "API Standard", desc: "FP16 Model Server" },
      { id: "v2", title: "H100 Pro Cluster", desc: "Ultra-low Latency" },
      { id: "v3", title: "INT8 Quantized", desc: "Cost-Effective Edge" },
    ];
  } else if (product.category === "compute") {
    return [
      { id: "v1", title: "8 Cores vCPU", desc: "32GB RAM" },
      { id: "v2", title: "16 Cores vCPU", desc: "64GB RAM" },
      { id: "v3", title: "32 Cores vCPU", desc: "128GB RAM" },
    ];
  } else if (product.category === "storage") {
    return [
      { id: "v1", title: "Hot Tier SSD", desc: "Instant Retrieve" },
      { id: "v2", title: "Warm Archive HDD", desc: "Optimized Billing" },
      { id: "v3", title: "Deep Ice Storage", desc: "Archival Backup" },
    ];
  } else {
    return [
      { id: "v1", title: "Mesh Core Edge", desc: "120 Global Nodes" },
      { id: "v2", title: "Enterprise Plus", desc: "Custom Routing" },
    ];
  }
};

const getSpecsForCategory = (category: string) => {
  if (category === "ai") {
    return [
      { label: "Công nghệ mô hình", value: "Transformer Decoder-only / Dense Attention" },
      { label: "Cụm phần cứng nền tảng", value: "NVIDIA H100 SXM5 / Google TPU v5p" },
      { label: "Số lượng tham số", value: "70B - 2.5T active parameters" },
      { label: "Tốc độ xử lý trung bình", value: "75 - 120 tokens/giây" },
      { label: "Độ trễ phản hồi (TTFT)", value: "Dưới 150ms cực nhanh" },
      { label: "Khả năng tinh chỉnh", value: "LoRA, QLoRA, Full Parameter tuning" },
      { label: "Chuẩn bảo mật dữ liệu", value: "SOC2 Type II, HIPAA, ISO 27001" },
    ];
  } else if (category === "compute") {
    return [
      { label: "Kiến trúc CPU", value: "AMD EPYC™ Genoa / Intel® Xeon® Scalable" },
      { label: "Tăng tốc GPU vật lý", value: "NVIDIA Hopper H100 80GB HBM3" },
      { label: "Chuẩn bộ nhớ RAM ảo", value: "DDR5 ECC registered 4800MHz" },
      { label: "Khả năng lưu trữ đệm", value: "PCIe Gen 5.0 NVMe SSD siêu tốc" },
      { label: "Băng thông mạng tối đa", value: "200 Gbps dedicated link" },
      { label: "Khả năng ảo hóa", value: "KVM Hypervisor / Direct Bare-Metal" },
      { label: "Hệ điều hành hỗ trợ", value: "Ubuntu, RHEL, Rocky Linux, Windows Server" },
    ];
  } else if (category === "storage") {
    return [
      { label: "Độ bền bỉ lý thuyết", value: "99.999999999% (11 Nines SLA)" },
      { label: "Chuẩn API truy xuất", value: "S3-compatible / RESTful Web Service" },
      { label: "Thời gian phục hồi", value: "Tức thì (Instant) đến 5 phút (Expedited)" },
      { label: "Chuẩn mã hóa dữ liệu", value: "AES-256 server-side encryption" },
      { label: "Hình thức sao lưu", value: "3 AZ Geo-replicated synchronous write" },
      { label: "Tốc độ I/O tối đa", value: "Lên đến 100,000 IOPS per volume" },
    ];
  } else {
    return [
      { label: "Số lượng điểm Edge", value: "120+ Anycast Point of Presence (PoPs)" },
      { label: "Băng thông phòng thủ", value: "Lên đến 2.5 Tbps inline mitigation" },
      { label: "Chuẩn chứng chỉ SSL", value: "TLS 1.3 / Automated Let's Encrypt CA" },
      { label: "Môi trường Edge Scripting", value: "Cloudflare-compatible V8 Isolate / WASM" },
      { label: "Giao thức định tuyến", value: "BGP Anycast routing with smart path selection" },
      { label: "Độ trễ trung bình toàn cầu", value: "Dưới 15ms Round-Trip-Time" },
    ];
  }
};

const calculateAccDiscount = (priceStr: string, oldPriceStr: string) => {
  try {
    const price = parseInt(priceStr.replace(/\./g, "").replace("đ", ""), 10);
    const oldPrice = parseInt(oldPriceStr.replace(/\./g, "").replace("đ", ""), 10);
    if (!isNaN(price) && !isNaN(oldPrice) && oldPrice > price) {
      const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
      return `Giảm ${pct}%`;
    }
  } catch (e) {
    // fallback
  }
  return "Giảm 10%";
};

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: (
    itemName: string,
    itemPrice: string,
    clickEvent?: React.MouseEvent | { clientX: number; clientY: number }
  ) => void;
  onFlyEffect?: (
    startX: number,
    startY: number,
    icon: string,
    color?: string,
    shadowColor?: string
  ) => void;
  onSpawnStars?: (x: number, y: number, color: string) => void;
  onFlyToAccount?: (
    startX: number,
    startY: number,
    icon?: string,
    color?: string,
    shadowColor?: string
  ) => void;
  viewMode?: "cloud" | "erp";
  gatewayUrl?: string;
}

function ProductDetailModal({ product, onClose, onAddToCart, onFlyEffect, onSpawnStars, onFlyToAccount, viewMode, gatewayUrl }: ProductDetailModalProps) {
  const images = getProductImagesList(product, viewMode !== "erp");
  const versions = getProductVersions(product);
  
  const baseVndInfo = getProductVNDDetails(product.id);
  const erpProductPriceInt = parseInt((product.price || "").replace(/\./g, "").replace("đ", ""), 10) || 0;
  const basePriceInt = viewMode === "erp"
    ? erpProductPriceInt
    : parseInt(baseVndInfo.present.replace(/\./g, "").replace("đ", ""), 10) || 5000000;
  const baseOldPriceInt = viewMode === "erp"
    ? 0
    : parseInt(baseVndInfo.old.replace(/\./g, "").replace("đ", ""), 10) || 5500000;

  const productSku = product.specs.find(s => s.label === "Mã SKU Sản phẩm")?.value || "";
  const [erpVariants, setErpVariants] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);

  useEffect(() => {
    if (viewMode === "erp" && productSku) {
      setLoadingVariants(true);
      loadGraphqlProductAttributes(productSku)
      .then(list => {
        setErpVariants(list);
        if (list.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const skuParam = params.get("sku");
          let initialIdx = 0;
          if (skuParam) {
            const foundIdx = list.findIndex((v: any) => v.sku?.sku?.toLowerCase() === skuParam.toLowerCase());
            if (foundIdx !== -1) {
              initialIdx = foundIdx;
            }
          }
          setSelectedVariantIdx(initialIdx);
        }
      })
      .catch(err => {
        console.error("Error fetching product variants", err);
      })
      .finally(() => {
        setLoadingVariants(false);
      });
    }
  }, [viewMode, productSku, gatewayUrl]);

  const activeVar = viewMode === "erp" && erpVariants.length > 0 ? erpVariants[selectedVariantIdx] : null;

  // Sync URL query parameters with active variant sku
  useEffect(() => {
    if (viewMode === "erp" && activeVar) {
      const skuVal = activeVar.sku?.sku;
      if (skuVal) {
        window.history.replaceState({ modal: "product-detail", sku: skuVal }, "", `/p#${encodeURIComponent(skuVal)}`);
      }
    }
  }, [viewMode, activeVar]);

  const getVersionModifier = (verId: string) => {
    if (verId === "v2") {
      if (basePriceInt > 30000000) return 5500000;
      if (basePriceInt > 10000000) return 2500000;
      if (basePriceInt > 2000000) return 800000;
      return 150000;
    }
    if (verId === "v3") {
      if (basePriceInt > 30000000) return 11000000;
      if (basePriceInt > 10000000) return 5000000;
      if (basePriceInt > 2000000) return 1600000;
      return 300000;
    }
    return 0; // v1
  };

  const getColorModifier = (colId: string) => {
    if (colId === "c2") {
      if (basePriceInt > 30000000) return 900000;
      if (basePriceInt > 10000000) return 400000;
      if (basePriceInt > 2000000) return 150000;
      return 40000;
    }
    return 0; // c1
  };

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [activeVersion, setActiveVersion] = useState(versions[0]?.id || "v1");
  const [activeColor, setActiveColor] = useState("c1");

  const erpPriceInt = activeVar ? Math.round(activeVar.salePrice * 24000) : 0;
  const erpOldPriceInt = activeVar ? Math.round(activeVar.price * 24000) : 0;

  const currentPriceInt = viewMode === "erp" && activeVar
    ? erpPriceInt
    : basePriceInt + getVersionModifier(activeVersion) + getColorModifier(activeColor);

  const currentOldPriceInt = viewMode === "erp" && activeVar
    ? erpOldPriceInt
    : baseOldPriceInt + getVersionModifier(activeVersion) + getColorModifier(activeColor);

  const formattedCurrentPrice = currentPriceInt > 0 ? currentPriceInt.toLocaleString("vi-VN") + "đ" : "";
  const formattedCurrentOldPrice = currentOldPriceInt > 0 ? currentOldPriceInt.toLocaleString("vi-VN") + "đ" : "";
  
  const currentDiscountPct = currentOldPriceInt > currentPriceInt
    ? Math.round(((currentOldPriceInt - currentPriceInt) / currentOldPriceInt) * 100)
    : 0;
  const formattedDiscount = currentDiscountPct > 0 ? `Giảm ${currentDiscountPct}%` : (viewMode === "erp" ? "" : "Giá ưu đãi");

  const colors = getProductColorOptions(product.category, formattedCurrentPrice);
  const selectedVersion = versions.find((version) => version.id === activeVersion);
  const selectedColor = colors.find((color) => color.id === activeColor);
  const selectedOptionLabel = viewMode === "erp" && activeVar
    ? `${activeVar.name}${activeVar.sku?.sku ? ` - SKU ${activeVar.sku.sku}` : ""}`
    : [selectedVersion?.title, selectedColor?.title].filter(Boolean).join(" - ");

  const [favoriteActive, setFavoriteActive] = useState(false);
  const [voucherCollected, setVoucherCollected] = useState(false);

  const [accTab, setAccTab] = useState<"watch" | "cloud" >(() => viewMode === "erp" ? "cloud" : "watch");
  const [addedAccs, setAddedAccs] = useState<string[]>([]);
  const [accPage, setAccPage] = useState(0);

  useEffect(() => {
    setAccTab(viewMode === "erp" ? "cloud" : "watch");
    setAccPage(0);
  }, [viewMode]);

  const watchAccessories = [
    {
      id: "w-acc-1",
      name: "Dây đeo Apple Watch 49/45/44/42mm Spigen Band Lite Fit",
      price: "513.000đ",
      oldPrice: "570.000đ",
      smember: "Smember giảm thêm đến 26.000đ",
      img: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "w-acc-2",
      name: "Dây đeo Apple Watch (44/45/46M) Otterbox Symmetry Cactus",
      price: "714.000đ",
      oldPrice: "1.190.000đ",
      smember: "Smember giảm thêm đến 36.000đ",
      img: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "w-acc-3",
      name: "Dây đeo Apple Watch Devia Deluxe Series Sport 6 Silicone Two-Tone",
      price: "162.000đ",
      oldPrice: "180.000đ",
      smember: "Smember giảm thêm đến 8.000đ",
      img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "w-acc-4",
      name: "Dây đeo Apple Watch Devia Elegant Series Milanese Loop",
      price: "252.000đ",
      oldPrice: "280.000đ",
      smember: "Smember giảm thêm đến 13.000đ",
      img: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "w-acc-5",
      name: "Dây đeo Silicon Sport Breathable 41/40/38mm",
      price: "120.000đ",
      oldPrice: "150.000đ",
      smember: "Smember giảm thêm đến 6.000đ",
      img: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "w-acc-6",
      name: "Dây đeo Da cao cấp Leather Link Apple Watch",
      price: "450.000đ",
      oldPrice: "500.000đ",
      smember: "Smember giảm thêm đến 20.000đ",
      img: "https://images.unsplash.com/photo-1539874754764-5a96559165b0?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "w-acc-7",
      name: "Ốp bảo vệ Spigen Tough Armor Apple Watch",
      price: "320.000đ",
      oldPrice: "350.000đ",
      smember: "Smember giảm thêm đến 15.000đ",
      img: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "w-acc-8",
      name: "Đế sạc không dây 3-trong-1 Anker Magnetic Charging",
      price: "950.000đ",
      oldPrice: "1.100.000đ",
      smember: "Smember giảm thêm đến 45.000đ",
      img: "https://images.unsplash.com/photo-1622445262465-2481c4574875?q=80&w=200&auto=format&fit=crop"
    }
  ];

  const cloudAccessories = [
    {
      id: "c-acc-1",
      name: "Dịch vụ Auto-Backup & Snapshots 100GB SSD",
      price: "120.000đ",
      oldPrice: "150.000đ",
      smember: "Smember giảm thêm đến 10.000đ",
      img: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "c-acc-2",
      name: "Địa chỉ IPv4 tĩnh Anycast Dedicated IP",
      price: "80.000đ",
      oldPrice: "100.000đ",
      smember: "Smember giảm thêm đến 5.000đ",
      img: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "c-acc-3",
      name: "Chứng chỉ bảo mật Wildcard SSL Cloud CA",
      price: "350.000đ",
      oldPrice: "400.000đ",
      smember: "Smember giảm thêm đến 20.000đ",
      img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "c-acc-4",
      name: "Băng thông CDN Express Core 1TB/tháng",
      price: "200.000đ",
      oldPrice: "250.000đ",
      smember: "Smember giảm thêm đến 15.000đ",
      img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "c-acc-5",
      name: "Premium DDoS Protection & Firewalls Core",
      price: "450.000đ",
      oldPrice: "600.000đ",
      smember: "Smember giảm thêm đến 30.000đ",
      img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "c-acc-6",
      name: "Object Storage S3-Compatible 500GB SSD",
      price: "250.000đ",
      oldPrice: "300.000đ",
      smember: "Smember giảm thêm đến 12.000đ",
      img: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "c-acc-7",
      name: "Managed Redis Cache Cluster 2GB RAM",
      price: "180.000đ",
      oldPrice: "220.000đ",
      smember: "Smember giảm thêm đến 9.000đ",
      img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "c-acc-8",
      name: "Load Balancer Anycast VIP High-Availability",
      price: "300.000đ",
      oldPrice: "360.000đ",
      smember: "Smember giảm thêm đến 15.000đ",
      img: "https://images.unsplash.com/photo-1597852074816-d933c4d2b988?q=80&w=200&auto=format&fit=crop"
    }
  ];

  const [showSpecsPopup, setShowSpecsPopup] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showSpecsPopup) {
          setShowSpecsPopup(false);
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showSpecsPopup]);

  type SpecSection = {
    id: string;
    title: string;
    items: { label: string; value: string }[];
  };

  const normalizeTextValue = (value: unknown) => {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  };

  const erpTechnicalSpecSections: SpecSection[] = viewMode === "erp" && activeVar?.specifications?.length
    ? activeVar.specifications
        .map((group: any, gIdx: number) => {
          const items = (group.specifications || [])
            .map((spec: any) => ({
              label: normalizeTextValue(spec.name || spec.key),
              value: normalizeTextValue(spec.value || spec.data)
            }))
            .filter((item: { label: string; value: string }) => item.label && item.value);

          return {
            id: `erp-technical-${gIdx}`,
            title: normalizeTextValue(group.groupName) || "Thông số kỹ thuật",
            items
          };
        })
        .filter((section: SpecSection) => section.items.length > 0)
    : [];

  const cloudSpecSections: SpecSection[] = [
    {
      id: "man-hinh",
      title: "Màn hình",
      items: [
        { label: "Công nghệ màn hình", value: "Màn hình Retina Luôn Bật với OLED góc rộng và LTPO3 Tốc độ làm mới 1Hz" },
        { label: "Độ phân giải", value: "422 x 514 pixel" },
        { label: "Độ sáng tối đa", value: "Lên đến 3000 nit" },
        { label: "Độ sáng tối thiểu", value: "1 nit" },
      ]
    },
    {
      id: "thiet-ke",
      title: "Thiết kế",
      items: [
        { label: "Chất liệu mặt kính", value: "Màn hình bằng kính sapphire phẳng" },
        { label: "Chất liệu viền", value: "Titanium" },
        { label: "Đường kính mặt", value: "49 mm" },
        { label: "Thiết kế", value: "Mặt vuông" },
        { label: "Trọng lượng", value: "61.8 gram" },
      ]
    },
    {
      id: "day-deo",
      title: "Dây đeo",
      items: [
        { label: "Chất liệu dây", value: "Cao su" },
        { label: "Độ dài dây", value: "Không công bố" },
        { label: "Bề rộng dây", value: "Không công bố" },
        { label: "Kích thước cổ tay phù hợp", value: "Vừa với cổ tay cỡ 13 - 21 cm" },
        { label: "Có thể thay dây", value: "Có" },
      ]
    },
    {
      id: "tinh-nang",
      title: "Tính năng",
      items: [
        { label: "Nghe, gọi", value: "Nghe gọi qua eSim" },
        { label: "Sức khỏe", value: "Đo ECG, SpO2, đo nhịp tim liên tục, nhiệt độ cơ thể, theo dõi giấc ngủ" },
        { label: "Cảm biến an toàn", value: "Phát hiện té ngã, Phát hiện va chạm xe, Còi báo động 86 decibel" },
        { label: "Khác", value: "Hỗ trợ điều khiển bằng cử chỉ chạm hai lần ngón tay (Double Tap)" },
      ]
    },
    {
      id: "cau-hinh",
      title: "Cấu hình",
      items: [
        { label: "Chip xử lý", value: "S10 SiP với bộ xử lý lõi kép 64-bit nhanh hơn" },
        { label: "Bộ nhớ trong", value: "64 GB" },
        { label: "Kết nối", value: "Wi-Fi 4, Bluetooth 5.3, Ultra Wideband (UWB) thế hệ thứ hai" },
      ]
    },
    {
      id: "pin",
      title: "Pin",
      items: [
        { label: "Thời lượng pin", value: "Lên đến 36 giờ sử dụng bình thường / Lên đến 72 giờ ở Chế độ Nguồn Điện Thấp" },
        { label: "Sạc nhanh", value: "Sạc nhanh trong 45 phút đạt 80% pin" },
      ]
    },
    {
      id: "thong-tin-khac",
      title: "Thông tin khác",
      items: [
        { label: "Chống nước & Bụi", value: "Chống nước ở độ sâu 100m (bơi, lặn với ống thở, lặn với bình dưỡng khí lên đến 40m), Đạt chuẩn chống bụi IP6X" },
        { label: "Hệ điều hành", value: "watchOS 11" },
        { label: "Năm ra mắt", value: "2024" },
      ]
    }
  ];

  const specSections: SpecSection[] = viewMode === "erp"
    ? erpTechnicalSpecSections
    : cloudSpecSections;

  const [activeTab, setActiveTab] = useState(() => specSections[0]?.id || "man-hinh");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (specSections.length > 0) {
      const ids = specSections.map(s => s.id);
      if (!ids.includes(activeTab)) {
        setActiveTab(specSections[0].id);
      }
    }
  }, [activeVar, viewMode]);

  const vndInfo = getProductVNDDetails(product.id);

  const handleModalScroll = () => {
    if (!contentRef.current) return;
    const container = contentRef.current;

    // Detect if content is scrolled down or has remaining scrollable distance below
    const hasScrollTop = container.scrollTop > 10;
    const hasScrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight > 10;
    setShowTopFade(hasScrollTop);
    setShowBottomFade(hasScrollBottom);

    let currentActive = specSections[0]?.id;
    let minDistance = Infinity;

    specSections.forEach((sec) => {
      const el = document.getElementById(`modal-spec-${sec.id}`);
      if (el) {
        const distance = Math.abs(el.offsetTop - container.offsetTop - 20);
        if (distance < minDistance) {
          minDistance = distance;
          currentActive = sec.id;
        }
      }
    });

    if (currentActive && currentActive !== activeTab) {
      setActiveTab(currentActive);
    }
  };

  useEffect(() => {
    if (showSpecsPopup) {
      const timer = setTimeout(() => {
        if (contentRef.current) {
          const container = contentRef.current;
          setShowTopFade(container.scrollTop > 10);
          setShowBottomFade(container.scrollHeight - container.scrollTop - container.clientHeight > 10);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowTopFade(false);
      setShowBottomFade(false);
    }
  }, [showSpecsPopup, activeVar, viewMode, activeTab]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-2 [perspective:1400px] sm:p-3">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-background/80 backdrop-blur-xl"
      />

      {/* Modal Body Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.78, y: 86, rotateX: 9, filter: "blur(18px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.9, y: 32, rotateX: -5, filter: "blur(12px)" }}
        transition={{ type: "spring", stiffness: 230, damping: 24, mass: 0.85 }}
        className="relative z-10 flex h-[96vh] w-[98vw] max-w-[1880px] flex-col overflow-hidden rounded-2xl border bg-background text-foreground shadow-2xl md:h-[98vh] md:w-[99vw]"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-primary/10"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        
        {/* Header bar with Breadcrumb, Title & Social elements */}
        <div className="relative shrink-0 border-b bg-card px-4 py-3 sm:px-6">
          
          {/* Breadcrumb line */}
          <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mb-1 select-none overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="hover:text-primary cursor-pointer">Trang chủ</span>
            <span>/</span>
            <span className="hover:text-primary cursor-pointer">
              {viewMode === "erp" ? (product.specs.find(s => s.label === "Nhóm Danh mục")?.value || "Sản phẩm") : "Đồng hồ thông minh"}
            </span>
            <span>/</span>
            <span className="truncate font-bold text-foreground">{product.name}</span>
          </div>

          {/* Title & Reviews Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-8">
            <div>
              <h1 className="font-sans font-bold text-sm sm:text-base text-foreground leading-tight flex flex-wrap items-center gap-2">
                <span>
                  {viewMode === "erp" 
                    ? `${product.name} ${activeVar ? `| Phiên bản: ${activeVar.name}` : ""}` 
                    : `${product.name} Cloud Server (5G) Viền Titan Dây Cao Su Size S/M | Chính hãng Cloud Việt Nam`}
                </span>
                <span className="text-[9px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-sm">
                  {viewMode === "erp" ? "CHÍNH HÃNG HORIZON" : "CHÍNH HÃNG APPLET"}
                </span>
              </h1>
              
              {/* Stars & Reviews */}
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-0.5 text-primary select-none">
                  <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                  <span className="text-muted-foreground text-[11.5px] font-bold ml-1">5 (1 đánh giá)</span>
                </div>
              </div>
            </div>

            {/* Social Share & Actions */}
            <div className="flex shrink-0 select-none items-center gap-2 self-start text-[11px] font-bold text-muted-foreground sm:self-center">
              <button className="flex cursor-pointer items-center gap-1 transition-colors hover:text-primary">
                <span className="material-symbols-outlined text-[16px] text-primary">chat_bubble</span>
                <span>Hỏi đáp</span>
              </button>
              <span className="text-border">|</span>
              <button 
                onClick={() => {
                  const specsEl = document.getElementById("specs-section");
                  if (specsEl) {
                    specsEl.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                  setShowSpecsPopup(true);
                }}
                className="flex cursor-pointer items-center gap-1 transition-colors hover:text-primary"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                <span>Thông số</span>
              </button>
              <span className="text-border">|</span>
              <button className="flex cursor-pointer items-center gap-1 transition-colors hover:text-primary">
                <span className="material-symbols-outlined text-[16px] text-primary">compare_arrows</span>
                <span>So sánh</span>
              </button>
            </div>
          </div>

          {/* Close button inside header */}
          <button
            onClick={onClose}
            className="absolute right-4 top-3 z-20 flex size-7 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground transition-all hover:bg-muted active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px] font-black">close</span>
          </button>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 pb-28 scrollbar-thin sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-5 xl:gap-6 items-start">
            
            {/* LEFT COLUMN: Image Box, Highlights, Commitments */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              
              {/* Product Visual Area + Gallery Thumbnails grouped tightly for space optimization */}
              <div className="flex flex-col gap-3">
                {/* Product Visual & Image display area with 3D discount Ribbon */}
                <div className="group relative flex h-[390px] min-h-[390px] flex-col items-center justify-center overflow-visible rounded-xl border bg-card p-0 shadow-sm transition-all hover:shadow-md sm:h-[500px] sm:min-h-[500px]">
                  {formattedDiscount && (
                    <>
                      {/* Top 3D Ribbon: Giảm X% (Left) wrapped around the edge */}
                      <div className="absolute -top-1.5 left-[-4px] h-[26px] bg-gradient-to-r from-[#FF4D24] to-[#FF6B35] text-white text-[11px] font-black px-3 rounded-br-lg rounded-tr-sm shadow-[2px_2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center z-20 select-none">
                        {formattedDiscount}
                      </div>
                      {/* 3D Fold Corner for Left Ribbon */}
                      <div className="absolute top-[20px] left-[-4px] w-[4px] h-[4px] bg-destructive z-10" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
                    </>
                  )}

                  {/* Floating specs features badges */}
                  {viewMode === "erp" ? (
                    <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10 select-none">
                      <span className="flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[11px] font-bold text-primary">category</span>
                        {product.specs.find(s => s.label === "Nhóm Danh mục")?.value || "Sản phẩm ERP"}
                      </span>
                      {activeVar?.sku?.sku && (
                        <span className="flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary shadow-sm">
                          <span className="material-symbols-outlined text-[11px] font-bold text-primary">qr_code</span>
                          SKU: {activeVar.sku.sku}
                        </span>
                      )}
                      {activeVar?.statusProduct && (
                      <span className="flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[11px] font-bold text-primary">inventory</span>
                        {activeVar.statusProduct === "AVAILABLE" ? "Còn hàng" : activeVar.statusProduct}
                      </span>
                      )}
                    </div>
                  ) : (
                    <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10 select-none">
                      <span className="flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[11px] font-bold text-primary">bolt</span>
                        72 giờ
                      </span>
                      <span className="flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[11px] font-bold text-primary">ecg</span>
                        Nhịp tim
                      </span>
                      <span className="flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[11px] font-bold text-primary">sim_card</span>
                        eSim
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 z-0 size-full overflow-hidden rounded-xl">
                    <AnimatePresence mode="wait">
                      {images[activeImgIdx] ? (
                        <motion.img
                          key={`${product.id}-${activeImgIdx}`}
                          src={images[activeImgIdx]}
                          alt={product.name}
                          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                          initial={{ opacity: 0, scale: 1.04, x: 24, filter: "blur(10px)" }}
                          animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, scale: 0.985, x: -18, filter: "blur(8px)" }}
                          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                        />
                      ) : (
                        <motion.div
                          key="empty-image"
                          className="flex size-full items-center justify-center bg-muted text-[12px] font-bold text-muted-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Chưa có ảnh từ API
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Indicator Dots - overlay on the bottom */}
                  {images.length > 0 && (
                  <div className="absolute bottom-3 z-10 flex select-none items-center gap-1.5 rounded-full border bg-card/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                    {images.map((_, idx) => (
                      <span 
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeImgIdx === idx ? "w-3 bg-primary" : "w-1.5 bg-muted-foreground/35"}`} 
                      />
                    ))}
                  </div>
                  )}
                </div>

                {/* Gallery Thumbnail Strip - matching main image aspect ratio and optimized spacing */}
                <div id="thumbnail-strip" className="flex items-center justify-center gap-2 overflow-x-auto select-none scrollbar-none py-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImgIdx(idx)}
                      className={`flex h-[56px] w-[84px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-transparent p-0 shadow-xs transition-all ${
                        activeImgIdx === idx 
                          ? "scale-102 ring-2 ring-primary/40" 
                          : "hover:scale-101"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`}
                        className="size-full rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          const fallback = images[0] || getProductImage(product);
                          if (event.currentTarget.src !== fallback) {
                            event.currentTarget.src = fallback;
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Commitments Section */}
              {viewMode !== "erp" && (
              <div className="flex flex-col gap-2">
                <h4 className="font-sans font-bold text-[12px] uppercase text-foreground tracking-wider flex items-center gap-1.5 select-none">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                  Cam kết sản phẩm
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Commitment 1 */}
                  <div className="flex select-none items-start gap-3 rounded-xl border bg-card p-3 shadow-sm">
                    <span className="material-symbols-outlined text-emerald-500 text-[18px] font-bold shrink-0 mt-0.5">verified</span>
                    <div className="flex flex-col">
                      <span className="font-sans font-extrabold text-[12px] text-foreground">Chính hãng Cloud Việt Nam</span>
                      <span className="mt-0.5 text-[10.5px] font-medium leading-relaxed text-muted-foreground">Hàng chính hãng Cloud, Mới 100% đầy đủ chứng chỉ bảo mật và cam kết SLA doanh nghiệp 99.99%.</span>
                    </div>
                  </div>

                  {/* Commitment 2 */}
                  <div className="flex select-none items-start gap-3 rounded-xl border bg-card p-3 shadow-sm">
                    <span className="material-symbols-outlined text-emerald-500 text-[18px] font-bold shrink-0 mt-0.5">published_with_changes</span>
                    <div className="flex flex-col">
                      <span className="font-sans font-extrabold text-[12px] text-foreground">1 Đổi 1 trong 30 ngày</span>
                      <span className="mt-0.5 text-[10.5px] font-medium leading-relaxed text-muted-foreground">Đổi trả tài nguyên hoặc bồi hoàn tức thì nếu có lỗi từ phần cứng vật lý hoặc xung đột tài nguyên.</span>
                    </div>
                  </div>

                  {/* Commitment 3 */}
                  <div className="flex select-none items-start gap-3 rounded-xl border bg-card p-3 shadow-sm">
                    <span className="material-symbols-outlined text-emerald-500 text-[18px] font-bold shrink-0 mt-0.5">shield</span>
                    <div className="flex flex-col">
                      <span className="font-sans font-extrabold text-[12px] text-foreground">Bảo mật Cloud Shield</span>
                      <span className="mt-0.5 text-[10.5px] font-medium leading-relaxed text-muted-foreground">Đi kèm lá chắn phòng thủ nâng cao, ngăn chặn DDoS và hỗ trợ di trú dữ liệu miễn phí 24/7.</span>
                    </div>
                  </div>

                  {/* Commitment 4 */}
                  <div className="flex select-none items-start gap-3 rounded-xl border bg-card p-3 shadow-sm">
                    <span className="material-symbols-outlined text-emerald-500 text-[18px] font-bold shrink-0 mt-0.5">receipt_long</span>
                    <div className="flex flex-col">
                      <span className="font-sans font-extrabold text-[12px] text-foreground">Đã bao gồm thuế VAT</span>
                      <span className="mt-0.5 text-[10.5px] font-medium leading-relaxed text-muted-foreground">Giá sản phẩm đã bao gồm VAT 10%, hỗ trợ hoàn thuế VAT - Tax Refund cho doanh nghiệp.</span>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Product Technical Specs Section */}
              <div id="specs-section" className="mt-2 select-none rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                  <h4 className="font-sans font-bold text-[12px] uppercase text-foreground tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-muted-foreground">settings_suggest</span>
                    Thông số kỹ thuật
                  </h4>
                  <button 
                    onClick={() => setShowSpecsPopup(true)}
                    className="flex cursor-pointer items-center gap-0.5 text-[11px] font-bold text-muted-foreground hover:text-primary"
                  >
                    Xem thêm
                    <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {(viewMode === "erp" ? specSections.flatMap((section) => section.items).slice(0, 6) : getSpecsForCategory(product.category)).length > 0 ? (
                    (viewMode === "erp" ? specSections.flatMap((section) => section.items).slice(0, 6) : getSpecsForCategory(product.category)).map((spec, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-12 px-1 py-2 text-[11.5px] transition-colors hover:bg-muted/50">
                        <span className="col-span-5 font-medium text-muted-foreground">{spec.label}</span>
                        <span className="col-span-7 text-foreground font-semibold">{spec.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11.5px] py-3 px-1 text-muted-foreground font-semibold">
                      Chưa có dữ liệu specifications từ API.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Pricing, Versions, Colors, Promo, Call To Action */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              {/* Premium Pricing & Quick Info Box */}
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-sans font-black text-2xl text-primary leading-none">
                      {formattedCurrentPrice}
                    </span>
                    <span className="font-sans font-medium text-[12px] text-muted-foreground line-through leading-none">
                      {formattedCurrentOldPrice}
                    </span>
                  </div>
                  <span className="select-none rounded-full bg-secondary px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-secondary-foreground">
                    Trả góp 0%
                  </span>
                </div>

                <div className="flex items-center justify-between border-t pt-2.5 text-[11px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">verified</span>
                    Giá đã bao gồm VAT
                  </span>
                  <span className="flex cursor-pointer items-center gap-0.5 text-primary hover:underline">
                    Thu cũ đổi mới chỉ từ {formattedCurrentPrice}
                  </span>
                </div>
              </div>

              {/* Minimalist Member Promotion Bar */}
              <div className="flex select-none items-center gap-2 rounded-xl border bg-secondary p-3 text-secondary-foreground shadow-sm">
                <span className="material-symbols-outlined text-primary text-[16px] font-bold">loyalty</span>
                  <span className="text-[11px] font-bold leading-snug">
                  Tiết kiệm thêm tới <span className="font-extrabold">230.000đ</span> cho Smember. <span className="cursor-pointer font-black underline transition-colors hover:text-foreground">Đăng ký ngay</span>
                </span>
              </div>

              {/* Version Selection Grid / ERP Dynamic Variants Selector */}
              {viewMode === "erp" ? (
                <div className="flex flex-col gap-2">
                  <h4 className="flex items-center justify-between font-sans text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Chọn cấu hình biến thể (ERP):</span>
                    {loadingVariants && (
                      <span className="text-[10px] text-primary animate-pulse">Đang nạp...</span>
                    )}
                  </h4>
                  {loadingVariants ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-[52px] bg-muted animate-pulse rounded-xl" />
                      <div className="h-[52px] bg-muted animate-pulse rounded-xl" />
                    </div>
                  ) : erpVariants.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground p-3 bg-muted/50 rounded-xl border border-dashed border-slate-200">
                      Không tìm thấy cấu hình biến thể nào cho sản phẩm này.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {erpVariants.map((variant, idx) => {
                        const isSelected = selectedVariantIdx === idx;
                        const optsStr = variant.variantOptions 
                          ? variant.variantOptions.map((o: any) => `${o.name}: ${o.values.join(", ")}`).join(", ") 
                          : "";
                        const varPriceVnd = variant.salePrice ? Math.round(variant.salePrice * 24000) : 0;
                        const varPriceStr = varPriceVnd > 0 ? (varPriceVnd.toLocaleString("vi-VN") + "đ") : "Liên hệ";
                        
                        return (
                          <button
                            key={variant.id || idx}
                            onClick={() => setSelectedVariantIdx(idx)}
                            className={`relative p-3 rounded-xl border text-left flex flex-col justify-center min-h-[52px] cursor-pointer transition-all ${
                              isSelected 
                                ? "border-primary bg-secondary ring-1 ring-primary/30 shadow-sm" 
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-primary text-white w-3.5 h-3.5 rounded-full flex items-center justify-center select-none z-10">
                                <span className="material-symbols-outlined text-[9px] font-black">check</span>
                              </div>
                            )}
                            <span className={`font-sans text-[11.5px] font-bold ${isSelected ? "font-black text-foreground" : "text-foreground"}`}>
                              {variant.name}
                            </span>
                            <span className="text-[9.5px] font-medium text-muted-foreground block mt-0.5 truncate">
                              {optsStr || variant.sku?.sku}
                            </span>
                            <span className="text-[10px] font-bold text-primary mt-1">
                              {varPriceStr}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Version Selection Grid */}
                  <div className="flex flex-col gap-2">
                    <h4 className="flex items-center justify-between font-sans text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Chọn phiên bản:</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {versions.map((ver) => {
                        const isSelected = activeVersion === ver.id;
                        return (
                          <button
                            key={ver.id}
                            onClick={() => setActiveVersion(ver.id)}
                            className={`relative p-3 rounded-xl border text-left flex flex-col justify-center min-h-[52px] cursor-pointer transition-all ${
                              isSelected 
                                ? "border-primary bg-secondary ring-1 ring-primary/30 shadow-sm" 
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-primary text-white w-3.5 h-3.5 rounded-full flex items-center justify-center select-none z-10">
                                <span className="material-symbols-outlined text-[9px] font-black">check</span>
                              </div>
                            )}
                            <span className={`font-sans text-[11.5px] font-bold ${isSelected ? "font-black text-foreground" : "text-foreground"}`}>
                              {ver.title}
                            </span>
                            <span className="text-[9.5px] font-medium text-muted-foreground block mt-0.5 truncate">
                              {ver.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color Selection Grid */}
                  <div className="flex flex-col gap-2">
                    <h4 className="font-sans text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                    Màu sắc: <span className="font-extrabold text-foreground">{colors.find(c => c.id === activeColor)?.title}</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {colors.map((color) => {
                        const isSelected = activeColor === color.id;
                        const colorPriceInt = basePriceInt + getVersionModifier(activeVersion) + getColorModifier(color.id);
                        const formattedColorPrice = colorPriceInt.toLocaleString("vi-VN") + "đ";
                        return (
                          <button
                            key={color.id}
                            onClick={() => setActiveColor(color.id)}
                            className={`relative p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                              isSelected 
                                ? "border-primary bg-secondary ring-1 ring-primary/30 shadow-sm" 
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 bg-primary text-white w-3.5 h-3.5 rounded-full flex items-center justify-center select-none z-10">
                                <span className="material-symbols-outlined text-[9px] font-black">check</span>
                              </div>
                            )}
                            <div className="flex size-7 shrink-0 items-center justify-center">
                              <span
                                className={`size-5 rounded-full ${color.swatchClass}`}
                                aria-hidden="true"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-sans font-bold text-[11px] text-foreground leading-tight truncate">
                                {color.title}
                              </span>
                              <span className="text-[9px] font-medium text-muted-foreground mt-0.5 leading-none">
                                {formattedColorPrice}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Promotion & Coupon Card - Seamless borderless design */}
              <div className="overflow-hidden rounded-xl border bg-card p-1 shadow-sm">
                {/* Promo header */}
                <div className="px-3 py-1.5 flex items-center gap-2 select-none">
                  <span className="material-symbols-outlined text-primary text-[15px] font-bold">redeem</span>
                  <span className="font-sans font-bold text-[11px] text-primary uppercase tracking-wider">Khuyến mãi đi kèm</span>
                </div>

                <div className="p-2.5 flex flex-col gap-2.5">
                  
                  {/* Coupon Ticket - Seamless borderless card with soft shadow */}
                  <div className="relative flex h-[52px] items-stretch overflow-hidden rounded-lg border bg-card">
                    <div className="w-[40px] bg-primary flex flex-col justify-center items-center shrink-0 px-0.5 select-none">
                      <span className="text-white text-[8px] font-black leading-none uppercase">GIẢM</span>
                      <span className="text-white text-[11px] font-black leading-none mt-0.5">5%</span>
                    </div>
                    <div className="flex flex-col justify-between flex-1 py-1.5 px-3 bg-card border-l border-dashed border-border/60 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-foreground text-[10.5px] leading-tight truncate">Voucher 5% cho thành viên mới</span>
                        <span className="text-[9px] text-muted-foreground font-semibold leading-none truncate mt-0.5">Tối đa 500K cho hóa đơn đầu</span>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[8.5px] text-muted-foreground font-bold uppercase font-mono tracking-wider">CLOUD5%</span>
                        <button
                          onClick={(e) => {
                            if (voucherCollected) return;
                            setVoucherCollected(true);
                            if (onSpawnStars) {
                              onSpawnStars(e.clientX, e.clientY, "#FF4D24");
                            }
                            if (onFlyToAccount) {
                              onFlyToAccount(e.clientX, e.clientY, "🎟️", "#FF4D24", "rgba(255,77,36,0.4)");
                            }
                          }}
                          disabled={voucherCollected}
                          className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all leading-none ${
                            voucherCollected
                              ? "cursor-default bg-secondary text-secondary-foreground"
                              : "cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80"
                          }`}
                        >
                          {voucherCollected ? "Đã nhận" : "Nhận ngay"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Terms list */}
                  <div className="flex flex-col gap-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">1</span>
                      <p>
                        Trả góp <span className="font-bold text-foreground">0% lãi suất</span>, tối đa 9 tháng, trả trước từ 10% qua CTTC hoặc 0đ qua thẻ tín dụng. <span className="cursor-pointer select-none font-bold text-primary hover:underline">Xem chi tiết</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">2</span>
                      <p>Nhận thêm miễn phí 1 năm bảo mật Cloud Shield và hỗ trợ di trú dữ liệu.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Frequently Bought Together (Phụ kiện mua cùng / Đề xuất mua kèm) Section */}
              {viewMode !== "erp" && (
              <div className="group/carousel relative flex select-none flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-sans font-bold text-[11.5px] uppercase text-foreground tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
                    Phụ kiện mua cùng
                  </h4>
                  <div className="flex rounded-lg border bg-muted p-0.5">
                    <button
                      onClick={() => { setAccTab("watch"); setAccPage(0); }}
                      className={`px-2.5 py-1 rounded-md text-[9.5px] font-bold transition-all cursor-pointer ${
                        accTab === "watch"
                          ? "bg-card text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Phụ kiện Watch
                    </button>
                    <button
                      onClick={() => { setAccTab("cloud"); setAccPage(0); }}
                      className={`px-2.5 py-1 rounded-md text-[9.5px] font-bold transition-all cursor-pointer ${
                        accTab === "cloud"
                          ? "bg-card text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Dịch vụ Cloud
                    </button>
                  </div>
                </div>

                {/* Left/Right Carousel Control Zones */}
                <button
                  onClick={() => setAccPage(prev => Math.max(0, prev - 1))}
                  disabled={accPage === 0}
                  className={`absolute inset-y-14 left-0 z-20 flex w-16 items-center justify-start rounded-l-xl bg-gradient-to-r from-background/95 via-background/65 to-transparent pl-2 text-primary shadow-[inset_18px_0_28px_rgba(255,77,36,0.08)] backdrop-blur-sm transition-all duration-300 ${
                    accPage === 0
                      ? "pointer-events-none opacity-0"
                      : "cursor-pointer opacity-0 hover:opacity-100 active:scale-[0.99] group-hover/carousel:opacity-100"
                  }`}
                  aria-label="Previous Page"
                >
                  <span className="flex size-8 items-center justify-center rounded-full border bg-card/85 shadow-sm backdrop-blur-md">
                    <span className="material-symbols-outlined text-[16px] font-bold">west</span>
                  </span>
                </button>

                <button
                  onClick={() => setAccPage(prev => Math.min(Math.ceil((accTab === "watch" ? watchAccessories : cloudAccessories).length / 3) - 1, prev + 1))}
                  disabled={accPage === Math.ceil((accTab === "watch" ? watchAccessories : cloudAccessories).length / 3) - 1}
                  className={`absolute inset-y-14 right-0 z-20 flex w-16 items-center justify-end rounded-r-xl bg-gradient-to-l from-background/95 via-background/65 to-transparent pr-2 text-primary shadow-[inset_-18px_0_28px_rgba(255,77,36,0.08)] backdrop-blur-sm transition-all duration-300 ${
                    accPage === Math.ceil((accTab === "watch" ? watchAccessories : cloudAccessories).length / 3) - 1
                      ? "pointer-events-none opacity-0"
                      : "cursor-pointer opacity-0 hover:opacity-100 active:scale-[0.99] group-hover/carousel:opacity-100"
                  }`}
                  aria-label="Next Page"
                >
                  <span className="flex size-8 items-center justify-center rounded-full border bg-card/85 shadow-sm backdrop-blur-md">
                    <span className="material-symbols-outlined text-[16px] font-bold">east</span>
                  </span>
                </button>

                {/* Horizontal Grid of accessory items - Paginated (3 items per page in a beautiful single-column stack) */}
                <div className="grid grid-cols-1 gap-4 px-2">
                  {(accTab === "watch" ? watchAccessories : cloudAccessories)
                    .slice(accPage * 3, (accPage + 1) * 3)
                    .map((item) => {
                      const isAdded = addedAccs.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className="relative flex h-[108px] items-center gap-3 overflow-visible rounded-xl border bg-card p-2.5 text-card-foreground transition-all hover:border-primary/40 hover:shadow-md sm:h-[124px] sm:gap-4 sm:p-3"
                        >
                          {/* Top 3D Ribbon: Giảm X% (Left) wrapped around the edge */}
                          <div className="absolute -top-1.5 left-[-4px] h-[22px] bg-gradient-to-r from-[#FF4D24] to-[#FF6B35] text-white text-[9.5px] font-black px-2 rounded-br-md rounded-tr-sm shadow-[1px_1px_3px_rgba(0,0,0,0.15)] flex items-center justify-center z-20 select-none">
                            {calculateAccDiscount(item.price, item.oldPrice)}
                          </div>
                          {/* 3D Fold Corner for Left Ribbon */}
                          <div className="absolute top-[16px] left-[-4px] w-[4px] h-[4px] bg-[#B43C00] z-10" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
                          {/* Left side: Product Image in a matching aspect ratio container */}
                          <div className="relative -my-2.5 -ml-2.5 flex h-[calc(100%+1.25rem)] w-[116px] shrink-0 items-center justify-center overflow-hidden rounded-l-xl bg-transparent p-0 sm:-my-3 sm:-ml-3 sm:h-[calc(100%+1.5rem)] sm:w-[136px]">
                            <img
                              src={item.img}
                              alt={item.name}
                              className="size-full object-cover transition-transform duration-500 hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Right side: Information and Add action */}
                          <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-0.5">
                            <div className="min-w-0">
                              <h5 className="font-bold text-[12px] sm:text-[13px] text-foreground leading-snug line-clamp-1 hover:text-black transition-colors cursor-pointer" title={item.name}>
                                {item.name}
                              </h5>
                              <span className="text-[9.5px] sm:text-[10px] font-semibold text-muted-foreground block mt-0.5 leading-none">
                                {item.smember}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-1">
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-[12.5px] sm:text-[13.5px] text-primary leading-none">
                                  {item.price}
                                </span>
                                <span className="text-[9.5px] sm:text-[10.5px] text-muted-foreground line-through leading-none mt-1">
                                  {item.oldPrice}
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  if (isAdded) return;
                                  setAddedAccs([...addedAccs, item.id]);
                                  if (onAddToCart) {
                                    onAddToCart(item.name, item.price, e);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 select-none cursor-pointer ${
                                  isAdded
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : "border border-transparent bg-secondary text-secondary-foreground hover:bg-muted active:scale-95"
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                                    Đã thêm
                                  </>
                                ) : (
                                  <>
                                    Thêm
                                    <span className="material-symbols-outlined text-[11px] font-bold">add</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Page indicator dots */}
                <div className="flex items-center justify-center gap-1.5 mt-1.5 select-none">
                  {Array.from({ length: Math.ceil((accTab === "watch" ? watchAccessories : cloudAccessories).length / 3) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAccPage(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${accPage === idx ? "w-3 bg-primary" : "w-1.5 bg-muted-foreground/35"}`}
                      aria-label={`Go to page ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
              )}



            </div>

          </div>

          {/* 2. ĐÁNH GIÁ & NHẬN XÉT SECTION (CellphoneS style but with premium airiness) */}
          <div className="mb-4 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-sans font-bold text-sm sm:text-base text-foreground mb-5 flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary font-black text-[20px]">reviews</span>
              <span>Đánh giá & nhận xét {viewMode === "erp" ? product.name : `${product.name} Cloud Server`}</span>
            </h2>

            {/* Overall Summary Row */}
            <div className="mb-6 grid grid-cols-1 items-center gap-6 rounded-xl border bg-background p-5 text-card-foreground shadow-sm md:grid-cols-3">
              
              {/* Left Side: Score & Button */}
              <div className="flex flex-col items-center justify-center text-center md:border-r border-border md:pr-6 py-2">
                <span className="font-sans font-black text-4xl text-foreground leading-none">5.0</span>
                <div className="flex items-center gap-0.5 text-primary my-2 select-none">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="material-symbols-outlined text-[16px] fill-current">star</span>
                  ))}
                </div>
                <span className="text-[11.5px] font-bold text-muted-foreground mb-4">1 đánh giá và phản hồi</span>
                <button className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 font-sans text-[11px] font-black uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/80 active:scale-95">
                  Viết đánh giá
                </button>
              </div>

              {/* Middle Side: Progress Bars */}
              <div className="flex flex-col justify-center gap-2.5 px-2 py-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 text-[11.5px] font-bold text-muted-foreground">
                    <span className="w-3 text-right">{stars}</span>
                    <span className="material-symbols-outlined text-[11px] text-primary fill-current">star</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary" 
                        style={{ width: stars === 5 ? "100%" : "0%" }}
                      />
                    </div>
                    <span className="w-16 text-muted-foreground font-semibold text-[10.5px]">{stars === 5 ? "1 đánh giá" : "0"}</span>
                  </div>
                ))}
              </div>

              {/* Right Side: Experience Ratings */}
              <div className="flex flex-col justify-center gap-3 md:pl-6 md:border-l border-border py-2">
                <h4 className="text-[11px] font-extrabold text-foreground uppercase tracking-wider select-none mb-1">Trải nghiệm dịch vụ</h4>
                
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Thời lượng hoạt động (SLA)", val: "5/5" },
                    { label: "Hiệu năng & Tốc độ", val: "5/5" },
                    { label: "Tính năng thông minh", val: "5/5" },
                    { label: "Độ dễ sử dụng (UX/DX)", val: "5/5" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                      <span>{item.label}</span>
                      <div className="flex items-center gap-0.5 text-primary select-none">
                        <span className="material-symbols-outlined text-[11px] fill-current">star</span>
                        <span className="text-foreground ml-1 font-black">{item.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* Filter Chips Bar */}
            <div className="flex items-center gap-2 flex-wrap mb-5 select-none border-b border-border pb-4">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Bộ lọc:</span>
              {[
                { label: "Tất cả đánh giá", active: true },
                { label: "Có hình ảnh", active: false },
                { label: "Đã mua hàng", active: false },
                { label: "5 sao", active: false },
                { label: "4 sao", active: false },
              ].map((chip, cIdx) => (
                <button
                  key={cIdx}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    chip.active 
                      ? "border-primary/30 bg-secondary text-primary" 
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Reviews List */}
            <div className="flex flex-col gap-4">
              
              {/* Review Card 1 */}
              <div className="flex gap-4 rounded-xl border bg-background p-4 shadow-sm sm:p-5">
                
                {/* User Avatar Circle */}
                <div className="flex size-9 shrink-0 select-none items-center justify-center rounded-full border bg-muted text-xs font-extrabold uppercase text-muted-foreground">
                  C
                </div>

                {/* Review Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1 flex-row">
                    <span className="font-sans font-bold text-[12.5px] text-foreground">chudinhthanh</span>
                    <span className="text-[10.5px] font-semibold text-muted-foreground">Đăng ngày 2 tháng trước</span>
                  </div>

                  {/* Stars & Verdict */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex items-center gap-0.5 text-primary select-none">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined text-[12px] fill-current">star</span>
                      ))}
                    </div>
                    <span className="text-emerald-600 text-[9.5px] font-bold uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/60 flex items-center gap-0.5 select-none">
                      <span className="material-symbols-outlined text-[10px] font-bold">verified</span>
                      Tuyệt vời
                    </span>
                  </div>

                  {/* Experience tags */}
                  {viewMode === "erp" ? (
                    <div className="flex items-center gap-2 flex-wrap mb-3.5 select-none">
                      <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Chất lượng sản phẩm: <span className="text-emerald-600 font-bold">Tuyệt vời (10/10)</span>
                      </span>
                      <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Đóng gói & Giao nhận: <span className="text-emerald-600 font-bold">Cực nhanh & Cẩn thận</span>
                      </span>
                      <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Hỗ trợ kỹ thuật: <span className="text-emerald-600 font-bold">Tận tình 24/7</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap mb-3.5 select-none">
                      <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        SLA hoạt động: <span className="text-emerald-600 font-bold">Cực ổn định (100%)</span>
                      </span>
                      <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Hiệu năng xử lý: <span className="text-emerald-600 font-bold">Siêu tốc và mượt mà</span>
                      </span>
                      <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Cấu hình: <span className="text-emerald-600 font-bold">Linh hoạt</span>
                      </span>
                    </div>
                  )}

                  {/* Content comment */}
                  <p className="text-[12px] font-medium text-muted-foreground leading-relaxed">
                    {viewMode === "erp" ? (
                      "Chưa có dữ liệu đánh giá từ API."
                    ) : (
                      `Đã mua sắm và deploy dự án của công ty lên hệ thống ${product.name} Cloud Server. Phải nói là tốc độ cực kỳ kinh khủng khiếp, mượt mà và không hề gián đoạn một giây phút nào cả. Giao diện trực quan đẹp mắt, đúng chuẩn hệ sinh thái đẳng cấp. Đặc biệt hỗ trợ kỹ thuật của các bạn tư vấn viên rất tận tình 24/7. Có thêm tính năng mua trả góp 0% quá tiện lợi cho startup quy mô nhỏ như bên mình. Đánh giá 5 sao không cần bàn cãi!`
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Floating bottom actions bar with 3D discount ribbon */}
        <div className="absolute bottom-5 left-1/2 z-30 flex w-[calc(100%-3rem)] max-w-[850px] -translate-x-1/2 items-center justify-between overflow-visible rounded-xl border border-white/20 bg-background/20 p-3 shadow-[0_20px_60px_rgba(255,77,36,0.11),0_8px_28px_rgba(0,0,0,0.07)] backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 sm:w-[85%]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
          {formattedDiscount && (
            <>
              {/* Top 3D Ribbon: Giảm X% (Left) wrapped around the edge */}
              <div className="absolute -top-1.5 left-[-4px] h-[25px] bg-gradient-to-r from-[#FF4D24] to-[#FF6B35] text-white text-[10.5px] font-black px-2.5 rounded-br-lg rounded-tr-sm shadow-[2px_2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center z-40 select-none">
                {formattedDiscount}
              </div>
              {/* 3D Fold Corner for Left Ribbon */}
              <div className="absolute top-[19px] left-[-4px] w-[4px] h-[4px] bg-[#B43C00] z-35" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
            </>
          )}
          
          {/* Left segment: Image, Name, Price */}
          <div className="relative -my-3 -ml-3 flex min-w-0 items-center gap-3 self-stretch">
            <div className="hidden h-full w-20 shrink-0 items-center justify-center overflow-hidden rounded-l-xl bg-transparent p-0 sm:flex">
              <img 
                src={images[0]} 
                alt={product.name} 
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-sans font-bold text-[12px] text-foreground truncate max-w-[140px] md:max-w-[280px] hidden md:block">
                {viewMode === "erp" ? product.name : `${product.name} Cloud Server`}
              </h4>
              {selectedOptionLabel && (
                <span className="hidden max-w-[140px] truncate text-[10px] font-bold leading-none text-muted-foreground md:block md:max-w-[280px]">
                  Đã chọn: {selectedOptionLabel}
                </span>
              )}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                <span className="font-sans font-extrabold text-[13px] sm:text-[14.5px] text-primary leading-tight">
                  {formattedCurrentPrice}
                </span>
                <span className="font-sans font-medium text-[10px] sm:text-[11.5px] text-muted-foreground line-through leading-none">
                  {formattedCurrentOldPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Right segment: Buttons */}
          <div className="relative flex items-center gap-2 shrink-0">
            <button 
              onClick={(e) => {
                if (onAddToCart) {
                  const isErp = viewMode === "erp" && activeVar;
                  const variantSku = activeVar?.sku?.sku || productSku;
                  const variantLabel = isErp
                    ? `${activeVar.name} [SKU: ${variantSku}]`
                    : `${product.name} (${versions.find(v => v.id === activeVersion)?.title || ""} - ${colors.find(c => c.id === activeColor)?.title || ""})`;
                  onAddToCart(variantLabel, "Trả góp 0%", e);
                }
                onClose();
              }}
              className="hidden h-10 cursor-pointer select-none items-center justify-center rounded-xl border border-primary px-3.5 py-2 text-[11.5px] font-bold text-primary transition-colors hover:bg-secondary sm:flex sm:px-4 sm:text-[12px]"
            >
              Trả góp 0%
            </button>
            
            <button
              onClick={(e) => {
                if (onAddToCart) {
                  const isErp = viewMode === "erp" && activeVar;
                  const variantSku = activeVar?.sku?.sku || productSku;
                  const variantLabel = isErp
                    ? `${activeVar.name} [SKU: ${variantSku}]`
                    : `${product.name} (${versions.find(v => v.id === activeVersion)?.title || ""} - ${colors.find(c => c.id === activeColor)?.title || ""})`;
                  onAddToCart(variantLabel, formattedCurrentPrice, e);
                }
                onClose();
              }}
              className="flex h-10 cursor-pointer select-none items-center justify-center rounded-xl bg-primary px-5 py-2 text-[11.5px] font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80 active:scale-97 sm:px-6 sm:text-[12px]"
            >
              MUA NGAY
            </button>

            <button
              onClick={(e) => {
                if (onAddToCart) {
                  const isErp = viewMode === "erp" && activeVar;
                  const variantSku = activeVar?.sku?.sku || productSku;
                  const variantLabel = isErp
                    ? `${activeVar.name} [SKU: ${variantSku}]`
                    : `${product.name} (${versions.find(v => v.id === activeVersion)?.title || ""} - ${colors.find(c => c.id === activeColor)?.title || ""})`;
                  onAddToCart(variantLabel, formattedCurrentPrice, e);
                }
                onClose();
              }}
              className="flex size-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-xl border border-primary p-2 text-primary transition-all hover:bg-secondary active:scale-95"
              title="Thêm vào giỏ hàng"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] font-bold">shopping_cart</span>
            </button>
          </div>

        </div>

        {/* Specs detail popup modal */}
        <AnimatePresence>
          {showSpecsPopup && (
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 select-none"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Backdrop with elegant glassmorphic blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowSpecsPopup(false);
                }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer"
              />

              {/* Specs modal container box - centered rectangle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.45 }}
                className="relative w-full max-w-[850px] h-[80vh] max-h-[720px] min-h-[400px] bg-card rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.2)] border border-slate-150 z-10 flex flex-col overflow-hidden text-foreground"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50/50 shrink-0">
                  <h3 className="font-sans font-black text-[15px] sm:text-[17px] text-foreground uppercase tracking-wide flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px] sm:text-[22px]">settings_suggest</span>
                    Thông số kĩ thuật
                  </h3>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowSpecsPopup(false);
                    }}
                    className="w-8 h-8 rounded-full bg-muted hover:bg-slate-200 text-muted0 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Tabs bar */}
                <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none border-b border-border bg-card px-4 py-2 gap-1 shrink-0">
                  {specSections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveTab(sec.id);
                        const el = document.getElementById(`modal-spec-${sec.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      className={`px-4 py-2 text-[12.5px] sm:text-[13.5px] font-bold rounded-xl transition-all cursor-pointer ${
                        activeTab === sec.id
                          ? "text-primary bg-primary/5 font-extrabold"
                          : "text-muted0 hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {sec.title}
                    </button>
                  ))}
                </div>

                {/* Content wrapper with scroll indicators */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                  {/* Top blur fade overlay */}
                  <div 
                    className={`absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent pointer-events-none z-20 transition-opacity duration-350 ${
                      showTopFade ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  {/* Content */}
                  <div
                    ref={contentRef}
                    onScroll={handleModalScroll}
                    className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scroll-smooth bg-card"
                  >
                    {specSections.length > 0 ? specSections.map((sec) => (
                      <div key={sec.id} id={`modal-spec-${sec.id}`} className="space-y-3 pt-1">
                        <h4 className="font-sans font-extrabold text-[13px] sm:text-[14px] text-foreground uppercase tracking-wider pb-1.5 border-b border-border flex items-center gap-1.5">
                          <span className="w-1.5 h-4 bg-primary rounded-sm"></span>
                          {sec.title}
                        </h4>
                        <div className="border border-border rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm bg-card">
                          {sec.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-1 sm:grid-cols-12 text-[12px] sm:text-[12.5px] py-3 px-4 transition-colors hover:bg-muted/50/40"
                            >
                              <div className="sm:col-span-4 text-muted0 font-bold sm:pr-4 flex items-center">
                                {item.label}
                              </div>
                              <div className="sm:col-span-8 text-foreground font-semibold mt-1 sm:mt-0 leading-relaxed">
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <div className="h-full flex items-center justify-center text-[12px] font-semibold text-muted-foreground">
                        Chưa có dữ liệu specifications từ API.
                      </div>
                    )}
                  </div>

                  {/* Bottom blur fade overlay */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none z-20 transition-opacity duration-350 ${
                      showBottomFade ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
