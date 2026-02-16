#!/usr/bin/env bash

# .bash_profile 추가
# if [ -f "pnpm-helper.sh" ]; then
#   source "pnpm-helper.sh"
# fi

# pnpm script completion for bash in the current repository.
# Supports both:
# - pnpm <script>
# - pnpm run <script>

complete -r pnpm 2>/dev/null

__pkg_scripts() {
  [ -f package.json ] || return 0
  command node -e "const fs=require('fs');try{const p=JSON.parse(fs.readFileSync('package.json','utf8'));console.log(Object.keys(p.scripts||{}).join(' '));}catch(e){}" 2>/dev/null
}

__pnpm_complete() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local scripts="$(__pkg_scripts)"
  [ -n "$scripts" ] || return 0

  if [[ $COMP_CWORD -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "$scripts" -- "$cur") )
    return 0
  fi

  if [[ "${COMP_WORDS[1]}" == "run" && $COMP_CWORD -eq 2 ]]; then
    COMPREPLY=( $(compgen -W "$scripts" -- "$cur") )
    return 0
  fi
}

# Keep ":" inside script names (e.g. kjca:dev) while completing.
COMP_WORDBREAKS=${COMP_WORDBREAKS//:}
complete -F __pnpm_complete pnpm
