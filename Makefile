# SPDX-FileCopyrightText: 2025 Sootpaws <sootpaws@proton.me>
#
# SPDX-License-Identifier: CC0-1.0

images:
	python3 psitool.py demo_images/complex_photo.jpg
	python3 psitool.py demo_images/simple_photo.jpg
	python3 psitool.py demo_images/pixel_art.png
	python3 psitool.py demo_images/many_dots.png

clean:
	rm demo_images/*.psi
	rm demo_images/*.sif
