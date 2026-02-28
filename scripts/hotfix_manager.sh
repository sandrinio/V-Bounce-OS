#!/bin/bash

# V-Bounce OS: Hotfix Manager
# Handles edge cases for L1 Trivial tasks to save tokens and ensure framework integrity.

COMMAND=$1

function show_help {
    echo "Usage: ./scripts/hotfix_manager.sh [command]"
    echo ""
    echo "Commands:"
    echo "  audit             Run a lightweight static analysis on recent hotfix commits to detect architectural drift."
    echo "  sync              Detect all active git worktrees and perform a safely automated rebase against the active sprint branch."
    echo "  ledger [title] [desc] Append a Hotfix entry to the §8 Applied Hotfixes ledger in the active DELIVERY_PLAN.md."
    exit 1
}

if [ -z "$COMMAND" ]; then
    show_help
fi

case "$COMMAND" in
    audit)
        echo "🔍 Running Token-Saving Hotfix Audit..."
        # Example lightweight check: grep for inline styles or console.logs in recently changed files
        # Assuming the hotfixes are on the current branch.
        # This checks the last 5 commits for obvious red flags.
        SUSPICIOUS=$(git diff HEAD~5 HEAD -G'style=|console\.log|// TODO' --name-only)
        
        if [ -n "$SUSPICIOUS" ]; then
            echo "⚠️  WARNING: Potential architectural drift detected in recent commits."
            echo "The following files contain inline styles, console.logs, or TODOs:"
            echo "$SUSPICIOUS"
            echo ""
            echo "Action Required: The Architect agent MUST perform a Deep Audit on these files."
            exit 1
        else
            echo "✅ No obvious architectural drift detected in recent hotfixes."
            exit 0
        fi
        ;;

    sync)
        echo "🔄 Syncing active worktrees with the latest hotfix..."
        
        # Check if .worktrees directory exists
        if [ ! -d ".worktrees" ]; then
            echo "✅ No active worktrees found. Nothing to sync."
            exit 0
        fi

        CURRENT_BRANCH=$(git branch --show-current)
        
        for dir in .worktrees/*/; do
            if [ -d "$dir" ]; then
                WORKTREE_NAME=$(basename "$dir")
                echo "Syncing worktree: $WORKTREE_NAME..."
                
                # Navigate into worktree, fetch, and rebase against the current sprint branch
                (cd "$dir" && git fetch origin && git rebase "origin/$CURRENT_BRANCH")
                
                if [ $? -eq 0 ]; then
                    echo "✅ Successfully synced $WORKTREE_NAME."
                else
                    echo "❌ Failed to sync $WORKTREE_NAME. Manual intervention required."
                fi
            fi
        done
        ;;

    ledger)
        TITLE=$2
        DESC=$3
        
        if [ -z "$TITLE" ] || [ -z "$DESC" ]; then
            echo "❌ Error: Missing title or description for the ledger."
            echo "Usage: ./scripts/hotfix_manager.sh ledger \"Fix Header\" \"Aligned the logo to the left\""
            exit 1
        fi

        # Find the active delivery plan
        DELIVERY_PLAN=$(find product_plans -name "DELIVERY_PLAN.md" | head -n 1)
        
        if [ -z "$DELIVERY_PLAN" ]; then
            echo "❌ Error: No DELIVERY_PLAN.md found in product_plans/."
            exit 1
        fi
        
        echo "📝 Updating Hotfix Ledger in $DELIVERY_PLAN..."

        # Check if §8 Applied Hotfixes exists, if not, create it
        if ! grep -q "## 8. Applied Hotfixes" "$DELIVERY_PLAN"; then
            echo "" >> "$DELIVERY_PLAN"
            echo "## 8. Applied Hotfixes" >> "$DELIVERY_PLAN"
            echo "" >> "$DELIVERY_PLAN"
            echo "| Date | Title | Brief Description |" >> "$DELIVERY_PLAN"
            echo "|---|---|---|" >> "$DELIVERY_PLAN"
        fi

        # Append the new row
        DATE=$(date "+%Y-%m-%d")
        echo "| $DATE | $TITLE | $DESC |" >> "$DELIVERY_PLAN"
        
        echo "✅ Ledger updated successfully."
        ;;

    *)
        echo "❌ Unknown command: $COMMAND"
        show_help
        ;;
esac
