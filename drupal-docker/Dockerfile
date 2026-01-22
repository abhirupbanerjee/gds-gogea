# Dockerfile
FROM php:8.1-apache

# Install PHP extensions Drupal needs
RUN apt-get update \
  && apt-get install -y \
       libpng-dev \
       libjpeg-dev \
       libonig-dev \
       libxml2-dev \
       unzip \
       git \
       curl \
  && docker-php-ext-install mysqli pdo pdo_mysql gd xml mbstring \
  && a2enmod rewrite

# Copy your Drupal code straight into Apache's default document root
COPY drupal_t/ /var/www/html/

# Fix permissions so Apache can write to files/
RUN chown -R www-data:www-data /var/www/html

# ✅ Patch settings.php for trusted hosts
RUN echo "\$settings['trusted_host_patterns'] = ['^localhost$', '^127\\.0\\.0\\.1$', '^drupal$', '^localhost\\.8001$'];" >> /var/www/html/sites/default/settings.php

# ✅ Copy script to manually disable image filter
COPY disable_image_filter.php /disable_image_filter.php

# ✅ Let Apache run (don't run the script in CMD)
CMD ["apache2-foreground"]
