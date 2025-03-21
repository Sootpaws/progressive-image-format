// SPDX-FileCopyrightText: 2025 Sootpaws <sootpaws@proton.me>
//
// SPDX-License-Identifier: LGPL-3.0-or-later

/// Loader for SIF images
class LinearLoader {
    constructor(stream, width, height) {
        // Rendered size of the image
        this.set_width = width;
        this.set_height = height;

        // Original size of the image
        this.img_width = null;
        this.img_height = null;

        // Size of a souce pixel in rendered pixels
        this.pixel_width = null;
        this.pixel_height = null;

        // Parsing state
        this.state = "header";
        this.next_x = 0;
        this.next_y = 0;

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

            if (this.state == "header" && length >= 4) {
                // Image header (width and height)
                this.img_width = buffer[0] * 0x100 + buffer[1];
                this.img_height = buffer[2] * 0x100 + buffer[3];

                // Calculate rendered pixel size
                this.pixel_width = this.set_width / this.img_width;
                this.pixel_height = this.set_height / this.img_height;

                consumed = 4;
                this.state = "pixels";
            } else if (this.state == "pixels" && length >= 4) {
                // Extract color
                const color = `rgba(
                    ${buffer[0]}, ${buffer[1]},
                    ${buffer[2]}, ${buffer[3]}
                )`;

                // Render pixel
                this.ctx.fillStyle = color;
                // Clamp to integer coordinates and dimensions to prevent
                // blurring and cross-pixel interference
                this.ctx.fillRect(
                    Math.floor(this.next_x * this.pixel_width),
                    Math.floor(this.next_y * this.pixel_height),
                    Math.ceil(this.pixel_width),
                    Math.ceil(this.pixel_height)
                );

                // Update pixel coordinates
                this.next_x++;
                if (this.next_x >= this.img_width) {
                    this.next_y++;
                    this.next_x = 0;
                }
                if (this.next_y >= this.img_height) {
                    this.state = "finished";
                    this.mark_complete(this.bytes + 4);
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
