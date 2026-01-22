<?php
use Drupal\Core\DrupalKernel;
use Symfony\Component\HttpFoundation\Request;

$autoloader = require_once '/var/www/html/autoload.php';
$kernel = DrupalKernel::createFromRequest(Request::createFromGlobals(), $autoloader, 'prod');
$kernel->boot();

$format = \Drupal\filter\Entity\FilterFormat::load('full_html');
if ($format && $format->filters('filter_html_image_secure')->status) {
    $format->disableFilter('filter_html_image_secure');
    $format->save();
    echo "✅ Image security filter disabled in Full HTML.\n";
} else {
    echo "ℹ️ Filter already disabled or Full HTML format not found.\n";
}
