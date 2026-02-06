<template>
  <EditorContent :editor="editor" />
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { watch } from 'vue';

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
      editor.value.commands.setContent(newValue);
    }
  },
);
/* ======================= 감시자 ======================= */
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

.ProseMirror h1 {
  margin: 0.75rem 0 0.5rem;
  font-size: 1.5rem;
  line-height: 1.3;
  font-weight: 700;
}

.ProseMirror h2 {
  margin: 0.75rem 0 0.5rem;
  font-size: 1.25rem;
  line-height: 1.35;
  font-weight: 700;
}

.ProseMirror h3 {
  margin: 0.6rem 0 0.4rem;
  font-size: 1.1rem;
  line-height: 1.4;
  font-weight: 600;
}

.ProseMirror p {
  margin: 0.5rem 0;
}

.ProseMirror ul,
.ProseMirror ol {
  margin: 0.5rem 0 0.75rem;
  padding-left: 1.25rem;
}

.ProseMirror ul {
  list-style: disc;
}

.ProseMirror ol {
  list-style: decimal;
}

.ProseMirror li {
  margin: 0.25rem 0;
}

.ProseMirror blockquote {
  margin: 0.75rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid var(--pico-muted-border-color);
  color: var(--pico-muted-color);
}

.ProseMirror code {
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  background: var(--pico-muted-border-color);
}
</style>
