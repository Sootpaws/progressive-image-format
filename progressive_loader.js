/// Loader for PSI images
class ProgressiveLoader {
    constructor(stream, width, height) {
        // Rendered size of the image
        this.set_width = width;
        this.set_height = height;

        // Original size of the image
        this.img_width = null;
        this.img_height = null;

        // Parsing state
        this.state = "header";
        this.layer_dimensions = [];
        this.layer_index = 0;
        this.next_x = 0;
        this.next_y = 0;
        this.prev_layer = null;
        this.current_layer = null;

        // Number of bytes used
        this.bytes = 0;

        // Canvas used for rendering
        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext("2d");

        // Promise resolved on loading completion
        this.complete = new Promise(res => this.mark_complete = res);

        // Start read loop
        this.read(stream);
    }

    /// Read data from a stream and process it
    async read(stream) {
        let buffer = new Uint8Array();
        for await (const chunk of stream) {
            // Add chunk to buffer
            let merged = new Uint8Array(buffer.length + chunk.length);
            merged.set(buffer);
            merged.set(chunk, buffer.length);

            // Process
            buffer = this.process(merged);

            // Exit on completion
            if (this.state == "finished") break;
        }
    }

    /// Process as much data as possible from the input buffer,
    /// returning any excess
    process(buffer) {
        while (true) {
            let consumed = 0;
            const length = buffer.length;

            if (this.state == "header" && length >= 8) {
                // Image header (magic, width, height)
                if (
                    buffer[0] != 0x00 ||
                    buffer[1] != 0x50 ||
                    buffer[2] != 0x53 ||
                    buffer[3] != 0x49
                ) {
                    console.error("Invalid magic bytes");
                    this.state = "error";
                    break;
                }
                this.img_width = buffer[4] * 0x100 + buffer[5];
                this.img_height = buffer[6] * 0x100 + buffer[7];

                // Calculate layer dimensions
                let width = this.img_width;
                let height = this.img_height;
                this.layer_dimensions = [{ width, height }];
                while (width > 1 && height > 1) {
                    width = Math.ceil(width / 2);
                    height = Math.ceil(height / 2);
                    this.layer_dimensions.unshift({ width, height });
                }

                consumed = 8;
                this.state = "layer";
            } else if (this.state == "layer" && length >= 1) {
                // Temporary layer start data
                if (buffer[0] != 0x4D) {
                    console.error("Invalid layer start data");
                    this.state = "error";
                    break;
                }

                // Update previous layer data
                this.prev_layer = this.current_layer;
                let size = this.layer_dimensions[this.layer_index];
                this.current_layer = new Uint8Array(size.width * size.height * 4);

                consumed = 1;
                this.state = "pixels";
            } else if (this.state == "pixels" && length >= 4) {
                // Get diff
                let diff = {
                    r: buffer[0] - 0x80 + 1,
                    g: buffer[1] - 0x80 + 1,
                    b: buffer[2] - 0x80 + 1,
                    a: buffer[3] - 0x80 + 1
                }

                // Get previous pixel
                let prev = null;
                if (this.layer_index == 0) {
                    // First layer, use default value
                    prev = {
                        r: 0x80,
                        g: 0x80,
                        b: 0x80,
                        a: 0x80
                    };
                } else {
                    // Get from previous layer data
                    let width = this.layer_dimensions[this.layer_index - 1].width;
                    let i = (Math.floor(this.next_x / 2) +
                        Math.floor(this.next_y / 2) * width) * 4;
                    prev = {
                        r: this.prev_layer[i + 0],
                        g: this.prev_layer[i + 1],
                        b: this.prev_layer[i + 2],
                        a: this.prev_layer[i + 3],
                    }
                }

                // Apply diff
                let pixel = {
                    r: prev.r + diff.r,
                    g: prev.g + diff.g,
                    b: prev.b + diff.b,
                    a: prev.a + diff.a,
                };

                // Update layer data
                let layer_size = this.layer_dimensions[this.layer_index];
                let i = (this.next_x + this.next_y * layer_size.width) * 4;
                this.current_layer[i + 0] = pixel.r;
                this.current_layer[i + 1] = pixel.g;
                this.current_layer[i + 2] = pixel.b;
                this.current_layer[i + 3] = pixel.a;

                // Calculate pixel size
                let pixel_width = this.set_width / layer_size.width;
                let pixel_height = this.set_height / layer_size.height;

                // Extract color
                let color = `rgba(
                    ${pixel.r}, ${pixel.g},
                    ${pixel.b}, ${pixel.a}
                )`;

                // Render pixel
                this.ctx.fillStyle = color;
                // Clamp to integer coordinates and dimensions to prevent
                // blurring and cross-pixel interference
                let x = Math.floor(this.next_x * pixel_width);
                let y = Math.floor(this.next_y * pixel_height);
                let pw = Math.ceil(pixel_width);
                let ph = Math.ceil(pixel_height);
                // Clear to prevent the previous layer showing through
                // transparent pixels
                this.ctx.clearRect(x, y, pw, ph);
                this.ctx.fillRect(x, y, pw, ph);

                // Update pixel coordinates
                let size = this.layer_dimensions[this.layer_index];
                this.next_x++;
                if (this.next_x >= size.width) {
                    this.next_y++;
                    this.next_x = 0;
                }
                if (this.next_y >= size.height) {
                    this.layer_index += 1;

                    if (
                        this.layer_index < this.layer_dimensions.length &&
                        // Early exit for low-resolution renders
                        (pixel_width >= 1 || pixel_height >= 1)
                    ) {
                        this.state = "layer";
                        this.next_y = 0;
                    } else {
                        this.state = "finished";
                        this.mark_complete(this.bytes + 4);
                    }
                }

                consumed = 4;
            }

            // If no processing could be done, wait for more data
            if (consumed == 0) return buffer;

            // Remove processed bytes
            this.bytes += consumed;
            buffer = buffer.slice(consumed);
        }
    }
}
