import { FFmpeg } from '@ffmpeg/ffmpeg';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';

let ffmpeg: FFmpeg | null = null;

const fetchFile = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

export const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: `${baseURL}/ffmpeg-core.js`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
  });
  
  return ffmpeg;
};

export const isImageFile = (file: File): boolean => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
  return imageTypes.includes(file.type) || 
    file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i) !== null;
};

export const isAudioFile = (file: File): boolean => {
  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'];
  return audioTypes.includes(file.type) || 
    file.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i) !== null;
};

export const isVideoFile = (file: File): boolean => {
  const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  return videoTypes.includes(file.type) || 
    file.name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) !== null;
};

export const isDocumentFile = (file: File): boolean => {
  const docTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/html',
    'text/csv'
  ];
  return docTypes.includes(file.type) || 
    file.name.match(/\.(pdf|docx|txt|html|csv|rtf)$/i) !== null;
};

export const convertImage = async (
  file: File, 
  targetFormat: string,
  quality: number = 0.92
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        let mimeType: string;
        switch (targetFormat.toLowerCase()) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'bmp':
            mimeType = 'image/bmp';
            break;
          default:
            mimeType = 'image/png';
        }
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image'));
            }
          },
          mimeType,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const convertAudio = async (
  file: File, 
  targetFormat: string,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const ffmpegInstance = await loadFFmpeg();
    
    const inputFileName = `input_${Date.now()}.${file.name.split('.').pop() || 'mp3'}`;
    const outputFileName = `output_${Date.now()}.${targetFormat}`;
    
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));
    
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }
    
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-acodec', targetFormat === 'mp3' ? 'libmp3lame' : 'pcm_s16le',
      '-ar', '44100',
      '-ab', '192k',
      outputFileName
    ]);
    
    const data = await ffmpegInstance.readFile(outputFileName);
    
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile(outputFileName);
    
    const mimeType = targetFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    // Convert data to BlobPart - handle Uint8Array, ArrayBuffer, or string
    const blobPart = data as unknown as BlobPart;
    return new Blob([blobPart], { type: mimeType });
  } catch (error) {
    console.error('Audio conversion error:', error);
    throw new Error(`Failed to convert audio to ${targetFormat}`);
  }
};

export const convertVideo = async (
  file: File, 
  targetFormat: string,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const ffmpegInstance = await loadFFmpeg();
    
    const inputFileName = `input_${Date.now()}.${file.name.split('.').pop() || 'mp4'}`;
    const outputFileName = `output_${Date.now()}.${targetFormat}`;
    
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));
    
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }
    
    const outputOptions = [];
    switch (targetFormat.toLowerCase()) {
      case 'mp4':
        outputOptions.push('-c:v', 'libx264', '-crf', '23', '-preset', 'medium');
        break;
      case 'webm':
        outputOptions.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0');
        break;
      case 'ogg':
        outputOptions.push('-c:v', 'libtheora', '-q:v', '7');
        break;
    }
    
    await ffmpegInstance.exec([
      '-i', inputFileName,
      ...outputOptions,
      outputFileName
    ]);
    
    const data = await ffmpegInstance.readFile(outputFileName);
    
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile(outputFileName);
    
    let mimeType = 'video/mp4';
    if (targetFormat === 'webm') mimeType = 'video/webm';
    if (targetFormat === 'ogg') mimeType = 'video/ogg';
    
    const blobPart = data as unknown as BlobPart;
    return new Blob([blobPart], { type: mimeType });
  } catch (error) {
    console.error('Video conversion error:', error);
    throw new Error(`Failed to convert video to ${targetFormat}`);
  }
};

export const convertToPDF = async (file: File): Promise<Blob> => {
  try {
    const pdfDoc = await PDFDocument.create();
    
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      
      const lines = text.split('\n');
      let y = height - 50;
      
      for (const line of lines) {
        if (y < 50) {
          const newPage = pdfDoc.addPage([612, 792]);
          y = newPage.getSize().height - 50;
        }
        
        page.drawText(line, {
          x: 50,
          y,
          size: 12,
          maxWidth: width - 100
        });
        
        y -= 20;
      }
    } else if (file.type.startsWith('image/')) {
      const imageBytes = await file.arrayBuffer();
      let image;
      
      if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }
      
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    } else {
      const page = pdfDoc.addPage([612, 792]);
      page.drawText(`File: ${file.name}`, {
        x: 50,
        y: 700,
        size: 24,
      });
      page.drawText(`Type: ${file.type}`, {
        x: 50,
        y: 670,
        size: 14,
      });
      page.drawText(`Size: ${file.size} bytes`, {
        x: 50,
        y: 640,
        size: 14,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    const blobPart = pdfBytes as unknown as BlobPart;
    return new Blob([blobPart], { type: 'application/pdf' });
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert to PDF');
  }
};

export const convertToDocx = async (file: File): Promise<Blob> => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [],
      }],
    });
    
    const text = await file.text();
    const paragraphs = text.split('\n').map(line => 
      new Paragraph({
        children: [new TextRun(line)],
      })
    );
    
    const blob = await Packer.toBlob(doc);
    return new Blob([blob], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  } catch (error) {
    console.error('DOCX conversion error:', error);
    throw new Error('Failed to convert to DOCX');
  }
};

export const convertToText = async (file: File): Promise<Blob> => {
  try {
    const text = await file.text();
    return new Blob([text], { type: 'text/plain' });
  } catch (error) {
    console.error('Text conversion error:', error);
    throw new Error('Failed to convert to text');
  }
};

export const convertFile = async (
  file: File,
  targetFormat: string,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  if (!file || !targetFormat) {
    throw new Error('File and target format are required');
  }
  
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';
  const targetExt = targetFormat.toLowerCase();
  
  if (onProgress) onProgress(0);
  
  let result: Blob;
  
  if (isImageFile(file) && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(targetExt)) {
    result = await convertImage(file, targetExt);
  } else if (isAudioFile(file) && ['mp3', 'wav', 'ogg', 'm4a'].includes(targetExt)) {
    result = await convertAudio(file, targetExt, onProgress);
  } else if (isVideoFile(file) && ['mp4', 'webm', 'ogg', 'avi'].includes(targetExt)) {
    result = await convertVideo(file, targetExt, onProgress);
  } else if (targetExt === 'pdf') {
    result = await convertToPDF(file);
  } else if (targetExt === 'docx') {
    result = await convertToDocx(file);
  } else if (targetExt === 'txt') {
    result = await convertToText(file);
  } else {
    throw new Error(`Unsupported conversion: ${sourceExt} to ${targetExt}`);
  }
  
  if (onProgress) onProgress(100);
  
  return result;
};