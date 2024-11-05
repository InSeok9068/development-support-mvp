<template>
  <EditorContent :editor="editor" @copy="copyHtmlToMarkdown" />
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { watch } from 'vue';
import TurndownService from 'turndown';

/* ======================= 변수 ======================= */
const editorArgs = defineModel<string | undefined>({ required: true });

const editor = useEditor({
  content: editorArgs.value,
  extensions: [StarterKit, Highlight, Typography],
  onUpdate: () => {
    editorArgs.value = editor.value?.getHTML();
  },
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(
  () => editorArgs.value,
  (newValue) => {
    if (!editor.value || !newValue) {
      return;
    }
    const isSame = editor.value.getHTML() === newValue;
    if (!isSame) {
      editor.value.commands.setContent(newValue, true);
    }
  },
);
/* ======================= 감시자 ======================= */

/* ======================= 메서드 ======================= */
const copyHtmlToMarkdown = () => {
  const turndownService = new TurndownService();
  navigator.clipboard.writeText(turndownService.turndown(editorArgs.value!));
};
/* ======================= 메서드 ======================= */
</script>

<style>
/* Basic editor styles */
.ProseMirror {
  outline: 0;
  padding: var(--pico-form-element-spacing-vertical) var(--pico-form-element-spacing-horizontal);
  border: var(--pico-border-width) solid var(--pico-form-element-border-color);
  border-radius: var(--pico-border-radius);
  background-color: var(--pico-form-element-background-color);
}
</style>
