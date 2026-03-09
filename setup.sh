#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "📦 Установка зависимостей..."
npm run install:all

echo "🔒 Установка pre-commit hook..."
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -qE "^data/[^.]"; then
  echo ""
  echo "❌ СТОП: файлы из data/ попали в коммит!"
  echo "   Это твои личные данные — они не должны быть в репо."
  echo "   Убери их: git reset HEAD data/"
  echo ""
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit

echo ""
echo "✅ Готово! Запусти: ./start.sh"
