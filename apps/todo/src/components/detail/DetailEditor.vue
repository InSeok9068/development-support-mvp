<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-1">
      <sl-button-group label="핵심 서식">
        <sl-button
          size="small"
          :disabled="!editor"
          :variant="editor?.isActive('bold') ? 'primary' : 'default'"
          aria-label="굵게"
          title="굵게"
          @click="onClickToggleBold"
        >
          <sl-icon name="type-bold"></sl-icon>
        </sl-button>
        <sl-button
          size="small"
          :disabled="!editor"
          :variant="editor?.isActive('italic') ? 'primary' : 'default'"
          aria-label="기울임"
          title="기울임"
          @click="onClickToggleItalic"
        >
          <sl-icon name="type-italic"></sl-icon>
        </sl-button>
        <sl-button
          size="small"
          :disabled="!editor"
          :variant="editor?.isActive('bulletList') ? 'primary' : 'default'"
          aria-label="불릿 목록"
          title="불릿 목록"
          @click="onClickToggleBulletList"
        >
          <sl-icon name="list-ul"></sl-icon>
        </sl-button>
        <sl-button
          size="small"
          :disabled="!editor"
          :variant="editor?.isActive('link') ? 'primary' : 'default'"
          aria-label="링크"
          title="링크"
          @click="onClickSetLink"
        >
          <sl-icon name="link-45deg"></sl-icon>
        </sl-button>
      </sl-button-group>

      <sl-button-group label="실행 취소">
        <sl-button
          size="small"
          :disabled="!(editor?.can().chain().focus().undo().run() ?? false)"
          aria-label="되돌리기"
          title="되돌리기"
          @click="onClickUndo"
        >
          <sl-icon name="arrow-counterclockwise"></sl-icon>
        </sl-button>
        <sl-button
          size="small"
          :disabled="!(editor?.can().chain().focus().redo().run() ?? false)"
          aria-label="다시하기"
          title="다시하기"
          @click="onClickRedo"
        >
          <sl-icon name="arrow-clockwise"></sl-icon>
        </sl-button>
      </sl-button-group>

      <sl-dropdown class="ml-auto" placement="bottom-end">
        <sl-button slot="trigger" size="small" :disabled="!editor" caret>
          <sl-icon name="three-dots"></sl-icon>
          더보기
        </sl-button>
        <sl-menu class="editor-more-actions-menu" @sl-select="onSlSelectMoreActions">
          <sl-menu-item value="paragraph">
            <sl-icon slot="prefix" name="paragraph"></sl-icon>
            본문
          </sl-menu-item>
          <sl-menu-item value="heading1">
            <sl-icon slot="prefix" name="type-h1"></sl-icon>
            제목 1
          </sl-menu-item>
          <sl-menu-item value="heading2">
            <sl-icon slot="prefix" name="type-h2"></sl-icon>
            제목 2
          </sl-menu-item>
          <sl-divider></sl-divider>
          <sl-menu-item value="orderedList">
            <sl-icon slot="prefix" name="list-ol"></sl-icon>
            번호 목록
          </sl-menu-item>
          <sl-menu-item value="blockquote">
            <sl-icon slot="prefix" name="blockquote-left"></sl-icon>
            인용
          </sl-menu-item>
          <sl-menu-item value="codeBlock">
            <sl-icon slot="prefix" name="code-slash"></sl-icon>
            코드 블록
          </sl-menu-item>
          <sl-divider></sl-divider>
          <sl-menu-item value="underline">
            <sl-icon slot="prefix" name="type-underline"></sl-icon>
            밑줄
          </sl-menu-item>
          <sl-menu-item value="strike">
            <sl-icon slot="prefix" name="type-strikethrough"></sl-icon>
            취소선
          </sl-menu-item>
          <sl-menu-item value="highlight">
            <sl-icon slot="prefix" name="highlighter"></sl-icon>
            하이라이트
          </sl-menu-item>
          <sl-divider></sl-divider>
          <sl-menu-item value="unsetLink">
            <sl-icon slot="prefix" name="x-lg"></sl-icon>
            링크 해제
          </sl-menu-item>
          <sl-menu-item value="clearFormatting">
            <sl-icon slot="prefix" name="eraser"></sl-icon>
            서식 지우기
          </sl-menu-item>
        </sl-menu>
      </sl-dropdown>

      <sl-tag size="small" class="hidden sm:inline-flex"> {{ characterCount }}자 </sl-tag>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { computed, watch } from 'vue';

/* ======================= 변수 ======================= */
const editorArgs = defineModel<string | undefined>({ required: true });

const editor = useEditor({
  content: editorArgs.value ?? '',
  editorProps: {
    attributes: {
      class: 'tiptap',
    },
  },
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2],
      },
    }),
    Underline,
    Link.configure({
      autolink: true,
      openOnClick: false,
      linkOnPaste: true,
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
    Highlight,
    Typography,
    Placeholder.configure({
      placeholder: '내용을 입력하세요. 마크다운 입력 규칙도 함께 동작합니다.',
    }),
    CharacterCount,
  ],
  onUpdate: ({ editor: currentEditor }) => {
    editorArgs.value = currentEditor.isEmpty ? '' : currentEditor.getHTML();
  },
});

const characterCount = computed(() => {
  const storage = editor.value?.storage as { characterCount?: { characters: () => number } } | undefined;
  return storage?.characterCount?.characters() ?? 0;
});
/* ======================= 변수 ======================= */

/* ======================= 감시자 ======================= */
watch(
  () => editorArgs.value,
  (newValue) => {
    if (!editor.value) {
      return;
    }

    const nextContent = newValue ?? '';
    const currentContent = editor.value.isEmpty ? '' : editor.value.getHTML();

    if (currentContent !== nextContent) {
      editor.value.commands.setContent(nextContent || '<p></p>');
    }
  },
);
/* ======================= 감시자 ======================= */

/* ======================= 메서드 ======================= */
const onClickSetParagraph = () => {
  editor.value?.chain().focus().setParagraph().run();
};

const onClickToggleHeadingLevel1 = () => {
  editor.value?.chain().focus().toggleHeading({ level: 1 }).run();
};

const onClickToggleHeadingLevel2 = () => {
  editor.value?.chain().focus().toggleHeading({ level: 2 }).run();
};

const onClickToggleBold = () => {
  editor.value?.chain().focus().toggleBold().run();
};

const onClickToggleItalic = () => {
  editor.value?.chain().focus().toggleItalic().run();
};

const onClickToggleUnderline = () => {
  editor.value?.chain().focus().toggleUnderline().run();
};

const onClickToggleStrike = () => {
  editor.value?.chain().focus().toggleStrike().run();
};

const onClickToggleHighlight = () => {
  editor.value?.chain().focus().toggleHighlight().run();
};

const onClickToggleBulletList = () => {
  editor.value?.chain().focus().toggleBulletList().run();
};

const onClickToggleOrderedList = () => {
  editor.value?.chain().focus().toggleOrderedList().run();
};

const onClickToggleBlockquote = () => {
  editor.value?.chain().focus().toggleBlockquote().run();
};

const onClickToggleCodeBlock = () => {
  editor.value?.chain().focus().toggleCodeBlock().run();
};

const onClickSetLink = () => {
  if (!editor.value) {
    return;
  }

  const previousUrl = editor.value.getAttributes('link').href as string | undefined;
  const inputValue = window.prompt('링크 URL을 입력하세요.', previousUrl ?? 'https://');
  if (inputValue === null) {
    return;
  }

  const trimmedUrl = inputValue.trim();
  if (!trimmedUrl) {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  const linkUrl = /^(https?:\/\/|mailto:|tel:)/i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
};

const onClickUnsetLink = () => {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
};

const onClickClearFormatting = () => {
  editor.value?.chain().focus().unsetAllMarks().clearNodes().run();
};

const onClickUndo = () => {
  editor.value?.chain().focus().undo().run();
};

const onClickRedo = () => {
  editor.value?.chain().focus().redo().run();
};

const onSlSelectMoreActions = (event: Event) => {
  const selectedItem = (event as CustomEvent<{ item: HTMLElement & { value?: string } }>).detail?.item;
  const action = selectedItem?.value ?? '';

  if (!action) {
    return;
  }

  if (action === 'paragraph') {
    onClickSetParagraph();
    return;
  }
  if (action === 'heading1') {
    onClickToggleHeadingLevel1();
    return;
  }
  if (action === 'heading2') {
    onClickToggleHeadingLevel2();
    return;
  }
  if (action === 'orderedList') {
    onClickToggleOrderedList();
    return;
  }
  if (action === 'blockquote') {
    onClickToggleBlockquote();
    return;
  }
  if (action === 'codeBlock') {
    onClickToggleCodeBlock();
    return;
  }
  if (action === 'underline') {
    onClickToggleUnderline();
    return;
  }
  if (action === 'strike') {
    onClickToggleStrike();
    return;
  }
  if (action === 'highlight') {
    onClickToggleHighlight();
    return;
  }
  if (action === 'unsetLink') {
    onClickUnsetLink();
    return;
  }
  if (action === 'clearFormatting') {
    onClickClearFormatting();
  }
};
/* ======================= 메서드 ======================= */
</script>

<style>
.tiptap {
  min-height: 12rem;
  padding: 0.75rem;
  outline: 0;
  line-height: 1.6;
  color: var(--sl-input-color);
}

.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  color: var(--sl-color-neutral-500);
  pointer-events: none;
}

.tiptap > *:first-child {
  margin-top: 0;
}

.tiptap > *:last-child {
  margin-bottom: 0;
}

.tiptap p {
  margin: 0.75rem 0;
}

.tiptap ul,
.tiptap ol {
  margin: 0.75rem 0;
  padding: 0 0 0 1.25rem;
}

.tiptap ul {
  list-style: disc;
}

.tiptap ol {
  list-style: decimal;
}

.tiptap li p {
  margin: 0.2rem 0;
}

.tiptap h1 {
  margin: 1rem 0 0.5rem;
  font-size: 1.5rem;
  line-height: 1.3;
  font-weight: 700;
}

.tiptap h2 {
  margin: 1rem 0 0.5rem;
  font-size: 1.25rem;
  line-height: 1.35;
  font-weight: 700;
}

.tiptap h3 {
  margin: 0.8rem 0 0.4rem;
  font-size: 1.1rem;
  line-height: 1.4;
  font-weight: 600;
}

.tiptap a {
  color: var(--sl-color-primary-700);
  text-decoration: underline;
}

.tiptap blockquote {
  margin: 1rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid var(--sl-color-neutral-400);
  color: var(--sl-color-neutral-600);
}

.tiptap code {
  padding: 0.12rem 0.35rem;
  border-radius: var(--sl-border-radius-small);
  background-color: var(--sl-color-neutral-200);
  font-size: 0.875em;
}

.tiptap pre {
  margin: 1rem 0;
  padding: 0.75rem;
  overflow-x: auto;
  border-radius: var(--sl-border-radius-medium);
  background-color: var(--sl-color-neutral-100);
}

.tiptap pre code {
  padding: 0;
  border-radius: 0;
  background-color: transparent;
}

.tiptap hr {
  margin: 1rem 0;
  border: none;
  border-top: 1px solid var(--sl-input-border-color);
}

.tiptap mark {
  background-color: var(--sl-color-warning-200);
  border-radius: var(--sl-border-radius-small);
}

.editor-more-actions-menu sl-menu-item::part(prefix) {
  margin-inline-end: 0.375rem;
}

.editor-more-actions-menu sl-menu-item::part(label) {
  display: inline-flex;
  align-items: center;
}
</style>
