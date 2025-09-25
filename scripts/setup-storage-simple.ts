import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

async function setupStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'ldc-assets';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔧 Setting up Supabase Storage...');

  try {
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    console.log('📦 Current buckets:', buckets?.map(b => b.name) || []);

    // Check if our bucket exists
    const bucketExists = buckets?.find(b => b.name === bucketName);

    if (!bucketExists) {
      console.log(`📦 Creating bucket: ${bucketName}...`);
      
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }

      console.log('✅ Bucket created successfully!');
    } else {
      console.log('✅ Bucket already exists!');
    }

    // Create folders structure
    const folders = ['images', 'materials'];
    
    for (const folder of folders) {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(`${folder}/.gitkeep`, Buffer.from(''), {
          contentType: 'text/plain',
          upsert: true
        });

      if (uploadError && uploadError.message !== 'The resource already exists') {
        console.log(`📁 Creating folder: ${folder}/`);
        if (uploadError.message !== 'Duplicate') {
          console.error(`❌ Error creating folder ${folder}:`, uploadError);
        }
      } else {
        console.log(`✅ Folder ${folder}/ ready`);
      }
    }

    console.log('🎉 Storage setup completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupStorage();

