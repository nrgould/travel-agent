'use client';

import { useEffect } from 'react';
import { LearningPath } from '@/lib/learning-path-schemas';
import { CreateLearningPathDialog } from './CreateLearningPathDialog';
import { usePdfStore } from '@/store/pdf-store';

export function PdfLearningPathCreator({ pdfId }: { pdfId: string }) {
	const { pdfFile, concept, gradeLevel, setPdf } = usePdfStore();

	// Load PDF from localStorage if pdfId is provided and not already in store
	useEffect(() => {
		if (pdfId && !pdfFile) {
			try {
				// Get the PDF data from localStorage
				const pdfData = localStorage.getItem(`pdf_${pdfId}`);

				// Also check the feynman_pdf_data for PDFs uploaded from the try-concepts page
				const feynmanPdfData = localStorage.getItem('feynman_pdf_data');
				const feynmanPdfInfo = localStorage.getItem('feynman_pdf_info');
				const feynmanPdfId = localStorage.getItem('feynman_pdf_id');

				// First try to use the PDF from the try-concepts page
				if (
					feynmanPdfData &&
					feynmanPdfInfo &&
					feynmanPdfId === pdfId
				) {
					try {
						const pdfInfo = JSON.parse(feynmanPdfInfo);

						// Convert base64 to blob
						const base64Response = feynmanPdfData;
						const binaryString = window.atob(
							base64Response.split(',')[1]
						);
						const bytes = new Uint8Array(binaryString.length);

						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}

						const blob = new Blob([bytes], {
							type: 'application/pdf',
						});
						const file = new File([blob], pdfInfo.name, {
							type: 'application/pdf',
						});

						// Store the file in our global store
						setPdf(file, pdfId);

						// Clean up localStorage
						localStorage.removeItem('feynman_pdf_data');
						localStorage.removeItem('feynman_pdf_info');
						localStorage.removeItem('feynman_pdf_id');

						return; // Exit early since we found the PDF
					} catch (error) {
						console.error(
							'Error loading PDF from feynman data:',
							error
						);
					}
				}

				// Fall back to the regular PDF storage if needed
				if (pdfData) {
					// Parse the stored PDF data
					const storedPdf = JSON.parse(pdfData);

					// Get concept and grade level if available
					const conceptValue = storedPdf.concept || '';
					const gradeLevelValue = storedPdf.gradeLevel || '';

					// Convert base64 to File object if fileData exists
					if (storedPdf.fileData && storedPdf.fileName) {
						// Convert base64 to blob
						const base64Response = storedPdf.fileData;
						const binaryString = window.atob(
							base64Response.split(',')[1]
						);
						const bytes = new Uint8Array(binaryString.length);

						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}

						const blob = new Blob([bytes], {
							type: 'application/pdf',
						});
						const file = new File([blob], storedPdf.fileName, {
							type: 'application/pdf',
						});

						// Store the file in our global store
						setPdf(file, pdfId, conceptValue, gradeLevelValue);

						// Clean up localStorage
						localStorage.removeItem(`pdf_${pdfId}`);
					}
				}
			} catch (error) {
				console.error('Error loading PDF from localStorage:', error);
			}
		}
	}, [pdfId, pdfFile, setPdf]);

	const handlePathCreated = (
		path: LearningPath,
		concept: string,
		gradeLevel: string,
		pathId?: string
	) => {
		// The CreateLearningPathDialog component already handles navigation
		// This callback can be used for any additional actions needed after path creation
		console.log('Learning path created:', pathId);
	};

	return (
		<div className='text-center'>
			<h1 className='text-2xl font-bold mb-4'>
				Create Learning Path from PDF
			</h1>
			<p className='text-muted-foreground mb-6'>
				We found a PDF that you want to create a learning path from.
				Please fill in the details below.
			</p>
			<CreateLearningPathDialog
				pdfId={pdfId}
				autoOpen={true}
				initialConcept={concept}
				initialGradeLevel={gradeLevel}
				triggerButton={<div className='hidden'>Hidden Trigger</div>}
				onPathCreated={handlePathCreated}
			/>
		</div>
	);
}
