/**
 * Bloco Gutenberg: custom-adm/image-only
 * 
 * Imagem Simples / Imagem Isolada com Link
 * Implementação em JavaScript Vanilla (ES5 / sem JSX / sem build step)
 * Padrão arquitetural do ecossistema customADM / luiz0067
 *
 * @package CustomADM
 */
(function (blocks, element, blockEditor, components, i18n) {
    'use strict';

    if (!blocks || !element || !blocks.registerBlockType) {
        return;
    }

    var el = element.createElement;
    var registerBlockType = blocks.registerBlockType;
    var __ = i18n.__;

    // Função de sanitização de URL para segurança contra XSS (evita javascript:, data:, vbscript:)
    function isSafeUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') {
            return false;
        }
        var trimmed = rawUrl.trim().toLowerCase();
        // Permite âncoras relativas, caminhos absolutos locais, http, https, tel e mailto
        if (trimmed.indexOf('/') === 0 || trimmed.indexOf('#') === 0 || trimmed.indexOf('?') === 0) {
            return true;
        }
        if (/^(https?|mailto|tel):/i.test(trimmed)) {
            return true;
        }
        return false;
    }

    // Função para validar URLs de imagem (permite http, https, caminhos relativos e data:image/ seguro)
    function isSafeImageUrl(rawUrl) {
        if (!rawUrl || typeof rawUrl !== 'string') {
            return false;
        }
        var trimmed = rawUrl.trim();
        if (trimmed.indexOf('/') === 0) {
            return true;
        }
        if (/^https?:\/\//i.test(trimmed)) {
            return true;
        }
        if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(trimmed)) {
            return true;
        }
        return false;
    }

    // Função para sanitizar maxWidth e prevenir injeção de CSS malicioso
    function sanitizeMaxWidth(val) {
        if (!val || typeof val !== 'string') {
            return '100%';
        }
        var trimmed = val.trim();
        // Permite apenas números acompanhados de unidades seguras CSS: %, px, rem, em, vw, ch, vh ou 'auto' / 'none'
        if (/^(auto|none|\d+(\.\d+)?(px|%|rem|em|vw|vh|ch))$/i.test(trimmed)) {
            return trimmed;
        }
        return '100%';
    }

    // Componentes do BlockEditor e Components
    var InspectorControls = blockEditor.InspectorControls || wp.editor.InspectorControls;
    var MediaUpload = blockEditor.MediaUpload || wp.editor.MediaUpload;
    var MediaUploadCheck = blockEditor.MediaUploadCheck || wp.editor.MediaUploadCheck;
    var PanelBody = components.PanelBody;
    var TextControl = components.TextControl;
    var ToggleControl = components.ToggleControl;
    var SelectControl = components.SelectControl;
    var Button = components.Button;
    var Dashicon = components.Dashicon;

    registerBlockType('custom-adm/image-only', {
        title: __('Imagem Simples (Image Only)', 'custom-adm'),
        description: __('Exibe uma imagem simples com link opcional, alinhamento e largura configuráveis.', 'custom-adm'),
        icon: 'format-image',
        category: 'media',
        keywords: [
            __('imagem', 'custom-adm'),
            __('banner', 'custom-adm'),
            __('foto', 'custom-adm'),
            __('image', 'custom-adm'),
            __('link', 'custom-adm')
        ],
        attributes: {
            imageUrl: {
                type: 'string',
                default: ''
            },
            imageId: {
                type: 'number',
                default: 0
            },
            altText: {
                type: 'string',
                default: ''
            },
            url: {
                type: 'string',
                default: ''
            },
            targetBlank: {
                type: 'boolean',
                default: false
            },
            alignment: {
                type: 'string',
                default: 'center'
            },
            maxWidth: {
                type: 'string',
                default: '100%'
            }
        },

        example: {
            attributes: {
                imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675"><rect width="1200" height="675" fill="%231e293b"/><circle cx="600" cy="270" r="110" fill="%233b82f6" opacity="0.3"/><polygon points="360,490 580,290 800,490" fill="%233b82f6" opacity="0.75"/><polygon points="520,490 680,350 840,490" fill="%2360a5fa" opacity="0.55"/><rect x="420" y="530" width="360" height="18" rx="9" fill="%2394a3b8" opacity="0.4"/></svg>',
                altText: __('Demonstração de Imagem Simples', 'custom-adm'),
                alignment: 'center',
                maxWidth: '650px',
                url: '',
                targetBlank: false
            }
        },

        edit: function (props) {
            var attributes = props.attributes;
            var setAttributes = props.setAttributes;

            var imageUrl = attributes.imageUrl;
            var imageId = attributes.imageId;
            var altText = attributes.altText;
            var url = attributes.url;
            var targetBlank = attributes.targetBlank;
            var alignment = attributes.alignment;
            var maxWidth = attributes.maxWidth;

            // Callback ao selecionar imagem na Media Library
            function onSelectImage(media) {
                if (!media) {
                    return;
                }
                var selectedUrl = media.url;
                if (media.sizes && media.sizes.large && media.sizes.large.url) {
                    selectedUrl = media.sizes.large.url;
                } else if (media.sizes && media.sizes.full && media.sizes.full.url) {
                    selectedUrl = media.sizes.full.url;
                }

                setAttributes({
                    imageUrl: selectedUrl,
                    imageId: media.id,
                    altText: altText || media.alt || media.title || ''
                });
            }

            // Callback para remover imagem
            function onRemoveImage() {
                setAttributes({
                    imageUrl: '',
                    imageId: 0,
                    altText: ''
                });
            }

            // Painel Lateral de Configurações (InspectorControls)
            var inspector = el(
                InspectorControls,
                { key: 'inspector' },
                // Configurações do Link
                el(
                    PanelBody,
                    {
                        title: __('Configurações de Link', 'custom-adm'),
                        initialOpen: true
                    },
                    el(TextControl, {
                        label: __('URL de Destino (Opcional)', 'custom-adm'),
                        value: url,
                        placeholder: 'https://exemplo.com.br',
                        onChange: function (newUrl) {
                            setAttributes({ url: newUrl });
                        }
                    }),
                    url ? el(ToggleControl, {
                        label: __('Abrir link em nova aba?', 'custom-adm'),
                        checked: !!targetBlank,
                        onChange: function (val) {
                            setAttributes({ targetBlank: val });
                        }
                    }) : null
                ),

                // Configurações de Imagem e Acessibilidade
                el(
                    PanelBody,
                    {
                        title: __('Acessibilidade e SEO', 'custom-adm'),
                        initialOpen: false
                    },
                    el(TextControl, {
                        label: __('Texto Alternativo (Alt Text)', 'custom-adm'),
                        help: __('Descreva o conteúdo da imagem para leitores de tela e SEO.', 'custom-adm'),
                        value: altText,
                        placeholder: __('Descrição da imagem...', 'custom-adm'),
                        onChange: function (newAlt) {
                            setAttributes({ altText: newAlt });
                        }
                    })
                ),

                // Configurações de Layout e Alinhamento
                el(
                    PanelBody,
                    {
                        title: __('Aparência e Alinhamento', 'custom-adm'),
                        initialOpen: true
                    },
                    el(SelectControl, {
                        label: __('Alinhamento Horizontal', 'custom-adm'),
                        value: alignment,
                        options: [
                            { label: __('Alinhar à Esquerda', 'custom-adm'), value: 'left' },
                            { label: __('Centralizar', 'custom-adm'), value: 'center' },
                            { label: __('Alinhar à Direita', 'custom-adm'), value: 'right' }
                        ],
                        onChange: function (newAlign) {
                            setAttributes({ alignment: newAlign });
                        }
                    }),
                    el(TextControl, {
                        label: __('Largura Máxima (Max Width)', 'custom-adm'),
                        help: __('Exemplos: 100%, 800px, 450px, 30rem', 'custom-adm'),
                        value: maxWidth,
                        placeholder: '100%',
                        onChange: function (newWidth) {
                            setAttributes({ maxWidth: newWidth });
                        }
                    })
                )
            );

            // Conteúdo dentro do canvas do editor Gutenberg
            var editorContent;

            if (!imageUrl) {
                // Estado 1: Nenhuma imagem selecionada (Placeholder)
                editorContent = el(
                    'div',
                    { className: 'customadm-image-only-placeholder' },
                    el(
                        'div',
                        { className: 'customadm-image-only-placeholder-inner' },
                        el(Dashicon, { icon: 'format-image', className: 'customadm-placeholder-icon' }),
                        el('h3', null, __('Nenhuma imagem selecionada', 'custom-adm')),
                        el(
                            'p',
                            null,
                            __('Selecione ou envie uma imagem da Biblioteca de Mídia para este bloco.', 'custom-adm')
                        ),
                        el(
                            MediaUploadCheck ? MediaUploadCheck : 'div',
                            null,
                            el(MediaUpload, {
                                onSelect: onSelectImage,
                                allowedTypes: ['image'],
                                value: imageId,
                                render: function (obj) {
                                    return el(
                                        Button,
                                        {
                                            isPrimary: true,
                                            onClick: obj.open,
                                            className: 'customadm-upload-btn'
                                        },
                                        el(Dashicon, { icon: 'upload' }),
                                        ' ' + __('Selecionar Imagem', 'custom-adm')
                                    );
                                }
                            })
                        )
                    )
                );
            } else {
                // Estado 2: Imagem selecionada com barra de ferramentas e preview
                var cleanMaxWidth = sanitizeMaxWidth(maxWidth);
                var wrapperStyle = {
                    maxWidth: cleanMaxWidth
                };

                editorContent = el(
                    'div',
                    {
                        className: 'customadm-image-only-editor-wrap align-' + (alignment || 'center')
                    },
                    el(
                        'div',
                        {
                            className: 'customadm-image-only-inner-box',
                            style: wrapperStyle
                        },
                        // Barra de Ações Rápidas no Hover/Editor
                        el(
                            'div',
                            { className: 'customadm-image-only-toolbar' },
                            el(
                                MediaUploadCheck ? MediaUploadCheck : 'div',
                                null,
                                el(MediaUpload, {
                                    onSelect: onSelectImage,
                                    allowedTypes: ['image'],
                                    value: imageId,
                                    render: function (obj) {
                                        return el(
                                            Button,
                                            {
                                                isSecondary: true,
                                                isSmall: true,
                                                onClick: obj.open,
                                                title: __('Alterar Imagem', 'custom-adm'),
                                                className: 'customadm-action-btn'
                                            },
                                            el(Dashicon, { icon: 'edit' }),
                                            ' ' + __('Alterar', 'custom-adm')
                                        );
                                    }
                                })
                            ),
                            el(
                                Button,
                                {
                                    isDestructive: true,
                                    isSmall: true,
                                    onClick: onRemoveImage,
                                    title: __('Remover Imagem', 'custom-adm'),
                                    className: 'customadm-action-btn'
                                },
                                el(Dashicon, { icon: 'trash' }),
                                ' ' + __('Remover', 'custom-adm')
                            )
                        ),
                        // Visualização da Imagem
                        el('img', {
                            src: isSafeImageUrl(imageUrl) ? imageUrl : '',
                            alt: altText || '',
                            className: 'customadm-image-only-preview-img'
                        }),
                        // Badge indicativo se tem link ativo
                        (url && isSafeUrl(url)) ? el(
                            'div',
                            { className: 'customadm-link-badge' },
                            el(Dashicon, { icon: 'admin-links' }),
                            ' ' + url.trim() + (targetBlank ? ' (nova aba)' : '')
                        ) : null
                    )
                );
            }

            return [inspector, editorContent];
        },

        save: function (props) {
            var attributes = props.attributes;
            var imageUrl = attributes.imageUrl;
            var altText = attributes.altText;
            var url = attributes.url;
            var targetBlank = attributes.targetBlank;
            var alignment = attributes.alignment || 'center';
            var maxWidth = attributes.maxWidth || '100%';

            // Se não houver imagem definida ou não for segura, não renderiza marcação vazia no frontend
            if (!imageUrl || !isSafeImageUrl(imageUrl)) {
                return null;
            }

            var imgTag = el('img', {
                src: imageUrl,
                alt: altText || '',
                className: 'customadm-image-only-img',
                loading: 'lazy'
            });

            var content;
            var safeUrl = isSafeUrl(url) ? url.trim() : '';

            if (safeUrl) {
                var linkProps = {
                    href: safeUrl,
                    className: 'customadm-image-only-link'
                };

                if (targetBlank) {
                    linkProps.target = '_blank';
                    linkProps.rel = 'noopener noreferrer';
                }

                content = el('a', linkProps, imgTag);
            } else {
                content = imgTag;
            }

            var wrapStyle = {};
            var cleanMaxWidth = sanitizeMaxWidth(maxWidth);
            if (cleanMaxWidth !== '100%') {
                wrapStyle.maxWidth = cleanMaxWidth;
            }

            return el(
                'div',
                {
                    className: 'customadm-image-only-wrap align-' + alignment,
                    style: Object.keys(wrapStyle).length > 0 ? wrapStyle : undefined
                },
                content
            );
        }
    });

})(
    window.wp && window.wp.blocks,
    window.wp && window.wp.element,
    window.wp && (window.wp.blockEditor || window.wp.editor),
    window.wp && window.wp.components,
    window.wp && window.wp.i18n
);
