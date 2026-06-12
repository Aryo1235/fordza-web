const fs = require('fs');
let code = fs.readFileSync('backend/repositories/products.repo.ts', 'utf8');

// The multi-replace messed up lines 420-427, inserting strange braces.
// Let's use string replace on the exact corrupted block.
const corrupted = `            });
          }
            },
          });
        }
      }
      return product;
    });`;

const fixed = `            });
          }
        }
        return product;
      });
    } catch (error: any) {
      throw error;
    }`;

code = code.replace(corrupted, fixed);

// Fix the update method's catch block too
code = code.replace(
  /\} catch \(error: any\) \{\s*throw new Error\(\`Gagal memperbarui produk: \$\{error\.message\}\`\);\s*\}/g,
  '} catch (error: any) {\n      throw error;\n    }'
);

fs.writeFileSync('backend/repositories/products.repo.ts', code);
console.log('Fixed products.repo.ts');
