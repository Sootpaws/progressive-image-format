/// Limit a stream to a bandwidth (KiB/s)
class BandwidthLimiter extends TransformStream {
    constructor(bandwidth) {
        super({ ...transform, bandwidth });
    }
}

const transform = {
    async transform(chunk, controller) {
        // Get next chunk
        chunk = await chunk;

        let prev_time = Date.now();
        let i = 0;
        while (i < chunk.length) {
            // Calculate number of bytes to transfer
            const now = Date.now();
            const elapsed = (now - prev_time) / 1000;
            prev_time = now;
            const length = Math.round(elapsed * this.bandwidth * 1024);

            // Perform transfer
            const end = Math.min(i + length, chunk.length);
            const subchunk = chunk.slice(i, end);
            controller.enqueue(subchunk);
            i += length;

            await wait(100);
        }
    }
};

/// Create a promise that resolves after a timeout
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

