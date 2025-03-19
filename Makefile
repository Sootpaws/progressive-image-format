images:
	python3 psitool.py demo_images/complex_photo.jpg
	python3 psitool.py demo_images/simple_photo.jpg
	python3 psitool.py demo_images/pixel_art.png
	python3 psitool.py demo_images/many_dots.png

clean:
	rm demo_images/*.psi
	rm demo_images/*.sif
