#!/usr/bin/env bash

.PHONY: 

run:
	ts-node "./src/runserver.ts"
	
up:
	docker-compose up -d

build_docker_image:
	docker build -t hrateserver:latest  .

build_docker_image_no_cache:
	docker build -t  hrateserver:latest . --no-cache 

docker_image_mark_as_release:
	docker tag hrateserver:latest hrateserver:release

docker_cleanup:
	docker system prune
