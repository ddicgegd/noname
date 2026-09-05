import { useRef, useState } from "react"
import {
  AddToBasketButton,
  AddToBasketImage,
  AddToBasketTarget,
  addToBasket,
  type AddToBasketImageHandle,
  type AddToBasketTargetHandle,
} from "@/components/motion-ui/add-to-basket"

export default function ProductCard() {
  const image = useRef<AddToBasketImageHandle>(null)
  const basket = useRef<AddToBasketTargetHandle>(null)
  const [count, setCount] = useState(0)

  const add = async () => {
    const landed = await addToBasket({
      image: image.current,
      basket: basket.current,
    })
    if (landed) setCount((value) => value + 1)
  }

  return (
    <div className="relative flex w-full max-w-[320px] flex-col items-center gap-7">
      <div className="absolute -top-2 right-0">
        <AddToBasketTarget
          ref={basket}
          className="flex size-11 items-center justify-center rounded-md border border-border bg-card text-foreground"
        >
          <BasketIcon />
        </AddToBasketTarget>
      </div>

      <div className="relative z-30">
        <AddToBasketImage
          ref={image}
          className="flex size-[132px] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-foreground"
        >
          <ToteIcon />
        </AddToBasketImage>
      </div>

      <div className="flex w-full items-baseline justify-between gap-4">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium text-foreground">
            Studio Tote
          </span>
          <span className="truncate text-xs text-muted-foreground">
            Waxed canvas, black
          </span>
        </span>
        <span className="shrink-0 font-mono text-sm tabular-nums text-foreground">
          £128
        </span>
      </div>

      <AddToBasketButton className="w-full" onClick={add}>
        Add to basket
      </AddToBasketButton>

      <span className="font-mono text-xs text-muted-foreground">
        {count} in basket
      </span>
    </div>
  )
}

function BasketIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 11-1 9" />
      <path d="m19 11-4-7" />
      <path d="M2 11h20" />
      <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
      <path d="M4.5 15.5h15" />
      <path d="m5 11 4-7" />
      <path d="m9 11 1 9" />
    </svg>
  )
}

function ToteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="72"
      height="72"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
