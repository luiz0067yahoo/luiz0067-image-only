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

    var el = element.createElement;
    var registerBlockType = blocks.registerBlockType;
    var __ = i18n.__;

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
                imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
                altText: __('Demonstração de Imagem Simples', 'custom-adm'),
                alignment: 'center',
                maxWidth: '650px',
                url: 'https://example.com',
                targetBlank: true
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
                            setAttributes({ maxWidth: newWidth || '100%' });
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
                var wrapperStyle = {
                    maxWidth: maxWidth || '100%'
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
                            src: imageUrl,
                            alt: altText || '',
                            className: 'customadm-image-only-preview-img'
                        }),
                        // Badge indicativo se tem link ativo
                        url ? el(
                            'div',
                            { className: 'customadm-link-badge' },
                            el(Dashicon, { icon: 'admin-links' }),
                            ' ' + url + (targetBlank ? ' (nova aba)' : '')
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

            // Se não houver imagem definida, não renderiza marcação vazia no frontend
            if (!imageUrl) {
                return null;
            }

            var imgTag = el('img', {
                src: imageUrl,
                alt: altText || '',
                className: 'customadm-image-only-img',
                loading: 'lazy'
            });

            var content;
            if (url) {
                var linkProps = {
                    href: url,
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
            if (maxWidth && maxWidth !== '100%') {
                wrapStyle.maxWidth = maxWidth;
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
    window.wp.blocks,
    window.wp.element,
    window.wp.blockEditor || window.wp.editor,
    window.wp.components,
    window.wp.i18n
);
