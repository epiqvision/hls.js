/*
 * EWMA Bandwidth Estimator
 *  - heavily inspired from shaka-player
 * Tracks bandwidth samples and estimates available bandwidth.
 * Based on the minimum of two exponentially-weighted moving averages with
 * different half-lives.
 */

import EWMA from '../utils/ewma';

class EwmaBandWidthEstimator {
  private defaultEstimate_: number;
  private minWeight_: number;
  private slow_: EWMA;
  private fast_: EWMA;

  constructor(slow: number, fast: number, defaultEstimate: number) {
    this.defaultEstimate_ = defaultEstimate;
    this.minWeight_ = 1;
    this.slow_ = new EWMA(slow);
    this.fast_ = new EWMA(fast);
  }

  sample(transferMs: number, numBytes: number) {
    // limit speed to mitigate uncertainty from very fast transfers
    if (numBytes) {
      transferMs = Math.max(transferMs, 2);
      // value is bandwidth in bits/s
      const bandwidthInBps = (8000 * numBytes) / transferMs;
      this.fast_.sample(bandwidthInBps);
      this.slow_.sample(bandwidthInBps);
    }
  }

  canEstimate(): boolean {
    return this.fast_.getTotalWeight() >= this.minWeight_;
  }

  getEstimate(): number {
    if (this.canEstimate()) {
      // console.log('slow estimate:'+ Math.round(this.slow_.getEstimate()));
      // console.log('fast estimate:'+ Math.round(this.fast_.getEstimate()));
      // Take the minimum of these two estimates.  This should have the effect of
      // adapting down quickly, but up more slowly.
      return Math.min(this.fast_.getEstimate(), this.slow_.getEstimate());
    } else {
      return this.defaultEstimate_;
    }
  }

  destroy() {}
}
export default EwmaBandWidthEstimator;
