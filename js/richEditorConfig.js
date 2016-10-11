/* global CKEDITOR */
CKEDITOR.editorConfig = function(config) {
	"use strict";
	config.extraPlugins = 'embed,autoembed';
	config.width = 'auto';
	config.toolbar = [
		{
			name: 'document',
			items: [
				'Source',
				'-',
				'Save',
				'NewPage',
				'Preview',
				'Print'
			]
		},
		{
			name: 'clipboard',
			items: [
				'Undo',
				'Redo'
			]
		},
		'/',
		{
			name: 'basicstyles',
			items: [
				'Bold',
				'Italic',
				'Underline',
				'Strike',
				'Subscript',
				'Superscript',
				'-',
				'RemoveFormat'
			]
		},
		{
			name: 'paragraph',
			items: [
				'NumberedList',
				'BulletedList',
				'-',
				'Outdent',
				'Indent',
				'-',
				'Blockquote',
				'-',
				'JustifyLeft',
				'JustifyCenter',
				'JustifyRight',
				'JustifyBlock',
				'-',
				'BidiLtr',
				'BidiRtl'
			]
		},
		{
			name: 'links',
			items: [
				'Link',
				'Unlink'
			]
		},
		{
			name: 'insert',
			items: [
				'Image',
				'Embed',
				'Table',
				'HorizontalRule',
				'PageBreak'
			]
		},
		'/',
		{
			name: 'styles',
			items: [
				'Styles',
				'Format',
				'Font',
				'FontSize'
			]
		},
		{
			name: 'colors',
			items: [
				'TextColor',
				'BGColor'
			]
		},
		{
			name: 'tools',
			items: ['ShowBlocks']
		},
		{
			name: 'highlighting',
			items: [
				'EumssiSearch',
				'DeleteHighlighting'
			]
		}
	];
};