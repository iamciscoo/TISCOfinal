# TISCO Email Templates - Edited Versions

## 📁 Folder Structure
```
email-templates-edited/
├── README.md                    ← This file
├── exported/                    ← HTML files from Email Studio
│   ├── order-confirmation.html
│   ├── welcome-email.html
│   └── ...
├── backups/                     ← Backup versions
│   ├── 2025-01-16-templates/
│   └── ...
└── ai-updates/                  ← Instructions for AI agent
    ├── update-request.md
    └── template-changes.json
```

## 🔄 Workflow for AI Agent Updates

### Step 1: Edit Templates in Email Studio
1. Open `email-studio-working.html`
2. Select template → Edit content → Customize styling
3. Click "Export HTML" → Save to `exported/` folder
4. Name files clearly: `order-confirmation-v2.html`

### Step 2: Request AI Agent Update
1. Save exported templates in `exported/` folder
2. Create update request in `ai-updates/update-request.md`
3. Ask AI agent: "Update my email templates with the new versions in exported/ folder"

### Step 3: AI Agent Instructions
The AI agent should:
- ✅ Read templates from `exported/` folder  
- ✅ Update main email system templates
- ✅ Maintain TISCOマーケット branding consistency
- ✅ Preserve delivery-focused messaging
- ✅ Test all template functionality
- ✅ Create backup before updates
- ✅ Document changes made

## 📋 Template Update Checklist
- [ ] Japanese branding "TISCOマーケット" preserved
- [ ] Mobile responsiveness maintained
- [ ] CTA links point to account pages
- [ ] Delivery-focused language (not shipping/tracking)
- [ ] Email styling matches brand colors
- [ ] All dynamic fields work correctly
- [ ] Footer contact info updated

## 🤖 AI Agent Sample Request
```markdown
Please update my email templates with the new versions I've created:

**Templates to Update:**
- exported/order-confirmation-v3.html → Replace current order confirmation
- exported/welcome-email-v2.html → Replace current welcome email

**Requirements:**
1. Maintain TISCOマーケット branding throughout
2. Keep delivery-focused messaging 
3. Preserve all dynamic field functionality
4. Test updates in Email Studio
5. Create backup of current versions

**System Integration:**
- Update templates in: client/lib/email-templates/
- Update any related configuration files
- Verify integration with Supabase email system
```

## 💡 Tips for Better Updates
- **Clear Naming**: Use version numbers (v1, v2, v3)
- **Document Changes**: Note what you modified in each version
- **Test First**: Always test in Email Studio before exporting
- **Incremental Updates**: Update 1-2 templates at a time
- **Backup Everything**: AI agent will create backups automatically
