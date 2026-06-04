const fs = require('fs');

const fixValidation = (file, schemaName) => {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Manual replacement for safeParse pattern
  const parts = code.split('const validation = ' + schemaName + '.safeParse');
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      let block = parts[i];
      // Find the end of the if (!validation.success) { ... } block
      let ifBlockStart = block.indexOf('if (!validation.success)');
      if (ifBlockStart !== -1) {
        let returnStart = block.indexOf('return NextResponse.json', ifBlockStart);
        if (returnStart !== -1) {
          let blockEnd = block.indexOf(');', returnStart);
          if (blockEnd !== -1) {
            // Find the closing brace of the if block
            let ifBlockEnd = block.indexOf('}', blockEnd);
            if (ifBlockEnd !== -1) {
              // Replace the whole block
              let matchStr = block.substring(0, ifBlockEnd + 1);
              let newStr = '(body);\n';
              // We need to change safeParse to parse!
              parts[i] = block.replace(matchStr, newStr);
            }
          }
        }
      }
    }
    code = parts.join('const validation = { data: ' + schemaName + '.parse');
    changed = true;
  }

  // Ensure handleError is used instead of raw NextResponse for catch blocks
  if (code.includes('catch (error: any) {') && code.includes('status: 500')) {
    code = code.replace(/catch \s*\(\s*error\s*:\s*any\s*\)\s*\{[\s\S]*?status:\s*500[\s\S]*?\)\s*;\s*\}/g, 'catch (error: any) {\n    return await handleError(error);\n  }');
    changed = true;
  }
  
  if (!code.includes('import { handleError }')) {
    code = code.replace(/import \{ NextResponse \} from "next\/server";/, 'import { NextResponse } from "next/server";\nimport { handleError } from "@/lib/error-handler";');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log('Fixed:', file);
  } else {
    console.log('No changes needed for:', file);
  }
};

fixValidation('app/api/admin/testimonials/route.ts', 'testimonialSchema');
fixValidation('app/api/admin/size-templates/route.ts', 'sizeTemplateSchema');
fixValidation('app/api/admin/banners/route.ts', 'bannerSchema');
fixValidation('app/api/admin/categories/route.ts', 'categorySchema');
