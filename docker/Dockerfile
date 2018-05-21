# STAGE 0: build static web

FROM node:9.11.1-alpine

LABEL maintainer Dong Xie <dong@coderobin.co.uk>

# Follow best practice to Not run as root user

RUN addgroup -g 1001 robin \
        && adduser -u 1001 -G robin -s /bin/sh -D robin

# install git; pkgs for npm install run.

RUN apk --update --no-cache \
        add \
        git \
        automake \
        alpine-sdk \
        nasm \
        autoconf \
        build-base \
        zlib \
        zlib-dev \
        libpng \
        libpng-dev \
        libwebp \
        libwebp-dev \
        libjpeg-turbo \
        libjpeg-turbo-dev \
        && rm -rf /var/lib/apt/lists/* \
        && rm /var/cache/apk/*

# install bower, gulp

RUN npm install bower gulp-cli -g

# switch to our local user

USER robin

WORKDIR /home/robin

RUN git clone https://github.com/coderobin/web.git --depth 1

WORKDIR web

RUN npm install

RUN bower install

RUN gulp generate-favicon

RUN gulp

# STAGE 1: build final

FROM nginx:1.13.12-alpine

RUN apk --update --no-cache \
        add \
        openssh \
        s6 \
        && rm -rf /var/lib/apt/lists/* \
        && rm /var/cache/apk/*

# any s6 run/finish file must chmod +x

ADD ./s6 /etc/s6

# setup sshd as required by Azure App Service

COPY sshd_config /etc/ssh/

RUN echo "root:Docker!" | chpasswd

# copy web site

COPY --from=0 /home/robin/web/dist /usr/share/nginx/html

COPY default.conf /etc/nginx/conf.d/

# misc

EXPOSE 80 2222

STOPSIGNAL SIGTERM

ENTRYPOINT [ "/bin/s6-svscan", "/etc/s6" ]
