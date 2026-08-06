/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface BurgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function BurgerButton({ isOpen, onClick }: BurgerButtonProps) {
  return (
    <div className="burger-wrapper fixed top-4 md:top-[27px] right-0 w-1/2 z-50 display flex justify-end items-center">
      <div className="inner pr-5 md:pr-10">
        <button
          id="burger-btn"
          className={`group w-[59px] h-[59px] rounded-full border-none cursor-pointer flex flex-col gap-1.5 items-center justify-center transition-colors duration-300 ${
            isOpen ? "bg-[#0B0B0B]" : "bg-[#F4F1E8] hover:bg-[#0B0B0B]"
          }`}
          onClick={onClick}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <span
            className={`block w-6 h-[2px] transition-all duration-300 ${
              isOpen
                ? "bg-[#F4F1E8] rotate-45 translate-y-[4px]"
                : "bg-[#111111] group-hover:bg-[#F4F1E8]"
            }`}
          />
          <span
            className={`block w-6 h-[2px] transition-all duration-300 ${
              isOpen
                ? "bg-[#F4F1E8] -rotate-45 -translate-y-[4px]"
                : "bg-[#111111] group-hover:bg-[#F4F1E8]"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
