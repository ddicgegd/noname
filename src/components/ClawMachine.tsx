/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClawCaptcha } from "./playcaptcha/ClawCaptcha";

interface ClawMachineProps {
  onVerify?: (verified: boolean) => void;
}

export default function ClawMachine({ onVerify }: ClawMachineProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <ClawCaptcha
        assetBase="/toys/"
        title="Verify you're human"
        onVerify={() => onVerify?.(true)}
      />
    </div>
  );
}
