FROM espocrm/espocrm:latest

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Instalar PHPUnit 11 oficial
RUN curl -sSL https://phar.phpunit.de/phpunit-11.phar -o /usr/local/bin/phpunit && \
    chmod +x /usr/local/bin/phpunit

# Herramientas de soporte para desarrollo y cobertura
RUN apt-get update && apt-get install -y git unzip && rm -rf /var/lib/apt/lists/* && \
    pecl install xdebug && docker-php-ext-enable xdebug && \
    echo "xdebug.mode=coverage" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini


