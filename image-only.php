<?php
/**
 * Plugin Name:       CustomADM - Image Only
 * Plugin URI:        https://github.com/luiz0067yahoo/luiz0067-image-only
 * Description:       Bloco customizado Gutenberg para exibição de imagem simples/isolada com link opcional, alinhamento e largura máxima.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Tested up to:      6.7
 * Requires PHP:      7.4
 * Author:            luiz0067
 * Author URI:        https://github.com/luiz0067yahoo
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       custom-adm
 * Domain Path:       /languages
 *
 * @package           CustomADM
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CUSTOMADM_IMAGE_ONLY_VERSION', '1.0.0');
define('CUSTOMADM_IMAGE_ONLY_PATH', plugin_dir_path(__FILE__));
define('CUSTOMADM_IMAGE_ONLY_URL', plugin_dir_url(__FILE__));

/**
 * Carrega o domínio de tradução do plugin
 */
function customadm_image_only_load_textdomain() {
    load_plugin_textdomain(
        'custom-adm',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
}
add_action('init', 'customadm_image_only_load_textdomain');

/**
 * Filtro para carregar arquivos de tradução do script sem prefixo (ex: languages/pt_BR.json).
 */
function customadm_image_only_script_translations($file, $handle, $domain) {
    if ('customadm-image-only-block' === $handle || 'custom-adm' === $domain) {
        $locale = determine_locale();
        $candidates = array(
            CUSTOMADM_IMAGE_ONLY_PATH . 'languages/' . $locale . '.json',
            CUSTOMADM_IMAGE_ONLY_PATH . 'languages/' . str_replace('-', '_', $locale) . '.json',
            CUSTOMADM_IMAGE_ONLY_PATH . 'languages/' . strtolower(str_replace('_', '-', $locale)) . '.json',
        );
        foreach ($candidates as $cand) {
            if (file_exists($cand)) {
                return $cand;
            }
        }
    }
    return $file;
}
add_filter('load_script_translation_file', 'customadm_image_only_script_translations', 10, 3);

/**
 * Registra a categoria customizada no editor Gutenberg se ainda não existir
 */
function customadm_image_only_block_categories($categories, $post) {
    $category_slugs = wp_list_pluck($categories, 'slug');

    if (!in_array('customadm-blocks', $category_slugs, true)) {
        $categories[] = array(
            'slug'  => 'customadm-blocks',
            'title' => __('CustomADM Blocos', 'custom-adm'),
            'icon'  => 'layout',
        );
    }

    return $categories;
}
add_filter('block_categories_all', 'customadm_image_only_block_categories', 10, 2);

/**
 * Registra os scripts, estilos e o bloco Gutenberg custom-adm/image-only
 */
function customadm_image_only_register_block() {
    // Registra o script JS do bloco (Vanilla ES5)
    wp_register_script(
        'customadm-image-only-block',
        CUSTOMADM_IMAGE_ONLY_URL . 'js/blocks/image-only.js',
        array(
            'wp-blocks',
            'wp-element',
            'wp-block-editor',
            'wp-editor',
            'wp-components',
            'wp-i18n'
        ),
        CUSTOMADM_IMAGE_ONLY_VERSION,
        true
    );

    // Suporte a traduções no JavaScript
    if (function_exists('wp_set_script_translations')) {
        wp_set_script_translations(
            'customadm-image-only-block',
            'custom-adm',
            CUSTOMADM_IMAGE_ONLY_PATH . 'languages'
        );
    }

    // Registra o CSS frontend
    wp_register_style(
        'customadm-image-only-style',
        CUSTOMADM_IMAGE_ONLY_URL . 'css/style.css',
        array(),
        CUSTOMADM_IMAGE_ONLY_VERSION
    );

    // Registra o CSS do editor
    wp_register_style(
        'customadm-image-only-editor-style',
        CUSTOMADM_IMAGE_ONLY_URL . 'css/editor.css',
        array('wp-edit-blocks'),
        CUSTOMADM_IMAGE_ONLY_VERSION
    );

    // Registro formal do bloco Gutenberg
    register_block_type('custom-adm/image-only', array(
        'editor_script' => 'customadm-image-only-block',
        'editor_style'  => 'customadm-image-only-editor-style',
        'style'         => 'customadm-image-only-style',
    ));
}
add_action('init', 'customadm_image_only_register_block');
