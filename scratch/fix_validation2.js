const fs = require('fs');

const fixValidation = (file, schemaName) => {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Safe manual replacement
  const pattern1 = 'const validation = ' + schemaName + '.safeParse';
  const parts = code.split(pattern1);
  
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      let block = parts[i];
      let ifBlockStart = block.indexOf('if (!validation.success)');
      if (ifBlockStart !== -1) {
        let blockEnd = block.indexOf(');', ifBlockStart);
        if (blockEnd !== -1) {
          let ifBlockEnd = block.indexOf('}', blockEnd);
          if (ifBlockEnd !== -1) {
            let matchStr = block.substring(0, ifBlockEnd + 1);
            let newStr = '(body);';
            parts[i] = block.replace(matchStr, newStr);
          }
        }
      }
    }
    code = parts.join('const validation = { data: ' + schemaName + '.parse');
    changed = true;
  }

  if (code.includes('catch (error: any) {') && code.includes('status: 500')) {
    code = code.replace(/catch \(\s*error:\s*any\s*\)\s*\{[\s\S]*?status:\s*500[\s\S]*?\)\s*;\s*\}/g, 'catch (error: any) {\n    return await handleError(error);\n  }');
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

fixValidation('app/api/admin/banners/route.ts', 'bannerSchema');
fixValidation('app/api/admin/categories/route.ts', 'categorySchema');
