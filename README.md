# Progressive Streamable Image Format

## Overview

## Format specification


Header:
- Magic (4 bytes): 0x00 0x50 0x53 0x49 - <null>PSI in ASCII
- Full width (BE u16) - Width of the full image in pixels
- Full height (BE u16) - Height of the full image in pixels
- Layer diffs:
    - Layer properties (1 byte)
      Number of bits in each component of the layer diffs.
          0 -> 2 bits (sm), 1 byte per pixel
          1 -> 4 bits (smmm), 2 bytes per pixel
          2 -> 6 bits (smmmmm), 3 bytes per pixel
          3 -> 8 bits (smmmmmmm), 4 bytes per pixel
    - Pixels:
        - R (n bits sign-magnitude)
        - G (n bits sign-magnitude)
        - B (n bits sign-magnitude)
        - A (n bits sign-magnitude)

## Simple Image Format

SIF is just about the simplest and most inefficient bitmap image format
possible, and is used here as a baseline to compare against.
The format is as follows:

Header:
- Full width (BE u16) - Width of the full image in pixels
- Full height (BE u16) - Height of the full image in pixels
- Pixels (left to right, top to bottom):
    - Pixel value in RGBA order, 1 byte unsigned per chanel

## Limitations

As this is only a proof-of-concept, there are numerous areas of potential
improvement. The most notable are as follows:

- Implementation
    - Resizability of rendered images - Images are rendered to a preset
        resolution and cannot be loaded further if the image scale is increased
    - Performance - Both the encoding and decoding/rendering have extremely poor
        preformance, and could be significantly optimized
    - Integration - The Javascript rendering system is difficult integrate into
        a standard webpage
- Analysis
    - Limited range of comparison samples - Although the images chosen for the
        demo and efficiency comparison are intended to cover a broad range of
        scenarios, an analysis of potential gains in a real-world environment
        would be much more conclusive
- Format
    - Fixed pixel format - All images are 8 bits per channel RGBA, but other
        formats exist and supporting them should be considered
    - No additional metadata - Most image formats support metadata for
        properties like color space, which are not currently part of
        the PSI format
    - Limited compression - Standard formats achieve much better compression
        ratios, negating the benefits of progressive loading
