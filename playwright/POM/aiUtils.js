import { ApiWaitUtils } from './apiWaitUtils';

const axios = require('axios');
const playwrightConfig = require('../../playwright.config');
const fs = require('fs');
const path = require('path');
const { basePrompt, dragAndDropPrompt, verificationPrompt } = require('./systemPrompts');

export class AIUtils {
    constructor(page, apiContext, testInfo) {
        this.page = page;
        this.apiContext = apiContext;
        this.apiWaitUtils = new ApiWaitUtils(this.page);
        this.testInfo = testInfo;
    }

   /**
	 * Check if a file exists at the given path
	 * @param {string} filePath - Path to check
	 * @returns {boolean} - True if file exists and is accessible, false otherwise
	 */
	checkFileExists(filePath) {
		try {
			if (!filePath || filePath.trim() === '') {
				console.log('No file path provided');
				return false;
			}

			const exists = fs.existsSync(filePath);
			console.log(`File ${exists ? 'exists' : 'does not exist'} at path: ${filePath}`);
			return exists;
		} catch (error) {
			console.error(`Error checking file at ${filePath}:`, error.message);
			return false;
		}
	}

	/**
	 * Extract filename from path and validate path
	 * @param {string} filePath - Path to process
	 * @returns {{ dir: string, filename: string }} Directory and filename
	 * @throws {Error} If path is invalid
	 */
	extractPathInfo(filePath) {
		try {
			if (!filePath || filePath.trim() === '') {
				throw new Error('No file path provided');
			}

			// Use path module to parse the file path
			const parsedPath = path.parse(filePath);
			if (!parsedPath.dir || !parsedPath.base) {
				throw new Error('Invalid file path structure');
			}

			return {
				dir: parsedPath.dir,
				filename: parsedPath.base,
			};
		} catch (error) {
			throw new Error(`Invalid file path: ${error.message}`);
		}
	}

	/**
	 * Compares two screenshots and analyzes them for functional differences using AI.
	 * @param {Locator} targetElementSelector - Playwright locator for the element to screenshot
	 * @param {string} savedImagePath - Path to the baseline image to compare against. If empty, saves current screenshot
	 * @param {string} [title] - Optional title prefix for the attached images in test results
	 * @param {string} [addOnPrompt=''] - Optional additional instructions for the AI analysis
	 * @returns {Promise<{
	 *   isScreenshotsMatching: boolean,
	 *   message: string,
	 *   hasDifferences: boolean,
	 *   differences: string[],
	 *   conclusion: string
	 * }>} Analysis result object
	 * @throws {Error} If there are issues with file operations or AI analysis
	 */
	async compareImages(targetElementSelector, savedImagePath, title, addOnPrompt = '') {
		try {
			// Take a screenshot of the target element
			const elementScreenshotBuffer = await targetElementSelector.screenshot();

			// If no saved image path is provided or path is empty
			if (!savedImagePath || savedImagePath.trim() === '') {
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
				savedImagePath = `./screenshots-testdata/comparison_${timestamp}.png`;
			}

			// Validate and extract path information
			let pathInfo;
			try {
				pathInfo = this.extractPathInfo(savedImagePath);
			} catch (error) {
				throw new Error(`Invalid path provided: ${error.message}`);
			}

			// Check if file exists
			const fileExists = fs.existsSync(savedImagePath);

			if (!fileExists) {
				// Ensure the directory exists
				if (!fs.existsSync(pathInfo.dir)) {
					try {
						fs.mkdirSync(pathInfo.dir, { recursive: true });
					} catch (mkdirError) {
						throw new Error(`Failed to create directory ${pathInfo.dir}: ${mkdirError.message}`);
					}
				}

				// Save the screenshot with the extracted filename
				try {
					fs.writeFileSync(savedImagePath, elementScreenshotBuffer);
					console.log(`Created new screenshot at: ${savedImagePath}`);
				} catch (writeError) {
					throw new Error(`Failed to write screenshot to ${savedImagePath}: ${writeError.message}`);
				}

				return {
					success: true,
					message: `New screenshot created with filename: ${pathInfo.filename}`,
					path: savedImagePath,
					fileExists: false,
				};
			}

			// If file exists, continue with comparison
			let savedImageBuffer;
			try {
				savedImageBuffer = fs.readFileSync(savedImagePath);
			} catch (readError) {
				throw new Error(`Failed to read existing image at ${savedImagePath}: ${readError.message}`);
			}

			// Get AI configuration from Playwright config
			const { aiConfig } = playwrightConfig;

			// Prepare the API request with focus on functional UI differences
			const requestData = {
				messages: [
					{
						role: 'system',
						content:
							'You are an expert UI/UX analyst. Analyze two screenshots for functional equivalence. Focus on:\n\n1. UI Elements:\n   - Interactive elements (buttons, links, inputs)\n   - Text content and icons\n   - Form field states\n\n2. Layout:\n   - Element alignment and spacing\n   - Content hierarchy\n   - Grid layouts\n\n3. States:\n   - Button states (enabled/disabled)\n   - Form states (focused/error)\n   - Menu states\n\n4. Accessibility:\n   - Clickable areas\n   - Navigation\n   - Validation indicators\n\n5. Content:\n   - Text truncation\n   - Image loading\n   - Dynamic content\n\nIgnore: color variations, pixel differences, anti-aliasing, background noise.\n\nProvide analysis in valid JSON format.',
					},
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: `Compare screenshots for functional equivalence. Check:\n\n1. UI Elements:\n   - Interactive elements present and positioned?\n   - Text content readable?\n   - Form fields in correct states?\n\n2. Layout:\n   - Alignment and spacing consistent?\n   - Content hierarchy maintained?\n   - Grid layouts preserved?\n\n3. States:\n   - Button states matching?\n   - Form states consistent?\n   - Menu states equivalent?\n\n4. Accessibility:\n   - Clickable areas accessible?\n   - Navigation working?\n   - Validation indicators present?\n\n5. Content:\n   - Text properly displayed?\n   - Images loading?\n   - Dynamic content placed?${addOnPrompt}\n\nResponse format:\n{\n  "isScreenshotsMatching": boolean,\n  "message": "string",\n  "hasDifferences": boolean,\n  "differences": ["string"],\n  "conclusion": "string"\n}`,
							},
							{
								type: 'image_url',
								image_url: {
									url: `data:image/png;base64,${savedImageBuffer.toString('base64')}`,
								},
							},
							{
								type: 'image_url',
								image_url: {
									url: `data:image/png;base64,${elementScreenshotBuffer.toString('base64')}`,
								},
							},
						],
					},
				],
				temperature: 0,
				max_tokens: 1000,
				response_format: { type: 'json_object' },
			};

			// Make the API call
			const response = await axios
				.post(
					`${aiConfig.apiUrl}/openai/deployments/${aiConfig.ivModel}/chat/completions?api-version=${aiConfig.apiVersion}`,
					requestData,
					{
						headers: {
							'Content-Type': 'application/json',
							'api-key': aiConfig.apiKey,
						},
					}
				)
				.catch(error => {
					console.error('Error making API call:', error.response?.data || error.message);
					throw error;
				});

			// Parse the AI response as JSON
			let analysis;
			try {
				// Clean the response content by removing markdown code block markers
				const cleanContent = response.data.choices[0].message.content
					.replace(/```json\n?/g, '') // Remove opening ```json
					.replace(/```\n?/g, '') // Remove closing ```
					.trim(); // Remove extra whitespace

				analysis = JSON.parse(cleanContent);
			} catch (parseError) {
				console.error('Error parsing AI response as JSON:', parseError);
				console.error('Raw response:', response.data.choices[0].message.content);
				// Fallback to text analysis if JSON parsing fails
				analysis = {
					isScreenshotsMatching: false,
					message: response.data.choices[0].message.content,
					hasDifferences: true,
					differences: ['Error parsing AI response'],
					conclusion: 'Error parsing AI response',
				};
			}

			console.log('AI Analysis:', JSON.stringify(analysis, null, 2));

			// Only attach results if differences are found
			if (analysis.hasDifferences) {
				try {
					// Attach analysis text first
					await this.testInfo.attach(title ? `${title}-analysis` : 'analysis', {
						contentType: 'application/json',
						body: Buffer.from(JSON.stringify(analysis, null, 2)),
						name: title ? `${title} - Image Comparison Analysis` : 'Image Comparison Analysis',
					});

					// Save and attach current image
					const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
					const currentImagePath = `./screenshots-testdata/current_${timestamp}.png`;
					fs.writeFileSync(currentImagePath, elementScreenshotBuffer);

					// Attach baseline image
					await this.testInfo.attach(title ? `${title}-baseline-image` : 'baseline-image', {
						path: savedImagePath,
						contentType: 'image/png',
						name: title ? `${title} - Baseline Image` : 'Baseline Image',
					});

					// Attach current image
					await this.testInfo.attach(title ? `${title}-current-image` : 'current-image', {
						path: currentImagePath,
						contentType: 'image/png',
						name: title ? `${title} - Current Image` : 'Current Image',
					});

					console.log('Successfully attached analysis and images for differences');

					// Clean up temporary files
					try {
						fs.unlinkSync(currentImagePath);
						console.log('Cleaned up temporary files');
					} catch (cleanupError) {
						console.warn('Warning: Failed to clean up temporary file:', cleanupError.message);
					}
				} catch (attachError) {
					console.error('Error attaching results:', attachError);
					console.error('Error details:', {
						message: attachError.message,
						stack: attachError.stack,
						testInfo: this.testInfo,
						hasAttach: typeof this.testInfo?.attach === 'function',
					});
				}
			} else {
				console.log('No differences found, skipping attachments');
			}

			return analysis;
		} catch (error) {
			console.error('Error comparing images:', error);
			return {
				success: false,
				message: error.message,
				hasDifferences: true,
				differences: ['Error during image comparison'],
				conclusion: 'Failed to compare images',
			};
		}
	}

	/**
	 * Compares two screenshots using AI analysis with custom system and user prompts.
	 * This method takes a screenshot of a target element and compares it with a saved baseline image.
	 * The comparison is performed using AI analysis with custom prompts for both system and user roles.
	 *
	 * @param {Locator} targetElementSelector - Playwright locator for the element to screenshot
	 * @param {string} savedImagePath - Path to the baseline image to compare against. If empty, saves current screenshot as new baseline
	 * @param {string} [title] - Optional title prefix for the attached images in test results
	 * @param {string} systemPrompt - Custom system prompt for the AI analysis
	 * @param {string} userPrompt - Custom user prompt for the AI analysis
	 * @returns {Promise<{
	 *   success: boolean,
	 *   message: string,
	 *   path?: string,
	 *   fileExists?: boolean,
	 *   isScreenshotsMatching?: boolean,
	 *   hasDifferences?: boolean,
	 *   differences?: string[],
	 *   conclusion?: string
	 * }>} Analysis result object containing comparison results and metadata
	 * @throws {Error} If there are issues with:
	 *   - Invalid file path
	 *   - File system operations (reading/writing files)
	 *   - API communication
	 *   - JSON parsing of AI response
	 */
	async compareImagesWithCustomPrompt(targetElementSelector, savedImagePath, title, systemPrompt, userPrompt) {
		try {
			// Take a screenshot of the target element
			const elementScreenshotBuffer = await targetElementSelector.screenshot();

			// If no saved image path is provided or path is empty
			let imagePath = savedImagePath;
			if (!imagePath || imagePath.trim() === '') {
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
				imagePath = `./screenshots-testdata/comparison_${timestamp}.png`;
			}

			// Validate and extract path information
			let pathInfo;
			try {
				pathInfo = this.extractPathInfo(savedImagePath);
			} catch (error) {
				throw new Error(`Invalid path provided: ${error.message}`);
			}

			// Check if file exists
			const fileExists = fs.existsSync(savedImagePath);

			if (!fileExists) {
				// Ensure the directory exists
				if (!fs.existsSync(pathInfo.dir)) {
					try {
						fs.mkdirSync(pathInfo.dir, { recursive: true });
					} catch (mkdirError) {
						throw new Error(`Failed to create directory ${pathInfo.dir}: ${mkdirError.message}`);
					}
				}

				// Save the screenshot with the extracted filename
				try {
					fs.writeFileSync(savedImagePath, elementScreenshotBuffer);
					console.log(`Created new screenshot at: ${savedImagePath}`);
				} catch (writeError) {
					throw new Error(`Failed to write screenshot to ${savedImagePath}: ${writeError.message}`);
				}

				return {
					success: true,
					message: `New screenshot created with filename: ${pathInfo.filename}`,
					path: savedImagePath,
					fileExists: false,
				};
			}

			// If file exists, continue with comparison
			let savedImageBuffer;
			try {
				savedImageBuffer = fs.readFileSync(savedImagePath);
			} catch (readError) {
				throw new Error(`Failed to read existing image at ${savedImagePath}: ${readError.message}`);
			}

			// Get AI configuration from Playwright config
			const { aiConfig } = playwrightConfig;

			// Prepare the API request with focus on functional UI differences
			const requestData = {
				messages: [
					{
						role: 'system',
						content: systemPrompt,
					},
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: userPrompt,
							},
							{
								type: 'image_url',
								image_url: {
									url: `data:image/png;base64,${savedImageBuffer.toString('base64')}`,
								},
							},
							{
								type: 'image_url',
								image_url: {
									url: `data:image/png;base64,${elementScreenshotBuffer.toString('base64')}`,
								},
							},
						],
					},
				],
				temperature: 0,
				max_tokens: 1000,
				response_format: { type: 'json_object' },
			};

			// Make the API call
			const response = await axios
				.post(
					`${aiConfig.apiUrl}/openai/deployments/${aiConfig.ivModel}/chat/completions?api-version=${aiConfig.apiVersion}`,
					requestData,
					{
						headers: {
							'Content-Type': 'application/json',
							'api-key': aiConfig.apiKey,
						},
					}
				)
				.catch(error => {
					console.error('Error making API call:', error.response?.data || error.message);
					throw error;
				});

			// Parse the AI response as JSON
			let analysis;
			try {
				// Clean the response content by removing markdown code block markers
				const cleanContent = response.data.choices[0].message.content
					.replace(/```json\n?/g, '') // Remove opening ```json
					.replace(/```\n?/g, '') // Remove closing ```
					.trim(); // Remove extra whitespace

				analysis = JSON.parse(cleanContent);
			} catch (parseError) {
				console.error('Error parsing AI response as JSON:', parseError);
				console.error('Raw response:', response.data.choices[0].message.content);
				// Fallback to text analysis if JSON parsing fails
				analysis = {
					isScreenshotsMatching: false,
					message: response.data.choices[0].message.content,
					hasDifferences: true,
					differences: ['Error parsing AI response'],
					conclusion: 'Error parsing AI response',
				};
			}

			console.log('AI Analysis:', JSON.stringify(analysis, null, 2));

			// Only attach results if differences are found
			if (analysis.hasDifferences) {
				try {
					// Attach analysis text first
					await this.testInfo.attach(title ? `${title}-analysis` : 'analysis', {
						contentType: 'application/json',
						body: Buffer.from(JSON.stringify(analysis, null, 2)),
						name: title ? `${title} - Image Comparison Analysis` : 'Image Comparison Analysis',
					});

					// Save and attach current image
					const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
					const currentImagePath = `./screenshots-testdata/current_${timestamp}.png`;
					fs.writeFileSync(currentImagePath, elementScreenshotBuffer);

					// Attach baseline image
					await this.testInfo.attach(title ? `${title}-baseline-image` : 'baseline-image', {
						path: savedImagePath,
						contentType: 'image/png',
						name: title ? `${title} - Baseline Image` : 'Baseline Image',
					});

					// Attach current image
					await this.testInfo.attach(title ? `${title}-current-image` : 'current-image', {
						path: currentImagePath,
						contentType: 'image/png',
						name: title ? `${title} - Current Image` : 'Current Image',
					});

					console.log('Successfully attached analysis and images for differences');

					// Clean up temporary files
					try {
						fs.unlinkSync(currentImagePath);
						console.log('Cleaned up temporary files');
					} catch (cleanupError) {
						console.warn('Warning: Failed to clean up temporary file:', cleanupError.message);
					}
				} catch (attachError) {
					console.error('Error attaching results:', attachError);
					console.error('Error details:', {
						message: attachError.message,
						stack: attachError.stack,
						testInfo: this.testInfo,
						hasAttach: typeof this.testInfo?.attach === 'function',
					});
				}
			} else {
				console.log('No differences found, skipping attachments');
			}

			return analysis;
		} catch (error) {
			console.error('Error comparing images:', error);
			return {
				success: false,
				message: error.message,
				hasDifferences: true,
				differences: ['Error during image comparison'],
				conclusion: 'Failed to compare images',
			};
		}
	}

	// Place this after the constructor in the Common class
	async disambiguateSelector(action) {
		// Create a copy of the action to avoid mutating the original
		const actionCopy = { ...action };
		
		if (actionCopy.selector) {
			const count = await this.page.locator(actionCopy.selector).count();
			if (count > 1) {
				// Try all combinations of parent selectors
				const parentSelectors = ['#toolbar', '#top-toolbar-menu-v2', '.main-toolbar', '.header-toolbar'];
				
				const getCombinations = (arr) => {
					const result = [];
					for (let i = 1; i <= arr.length; i += 1) {
						const combine = (prefix, rest, n) => {
							if (n === 0) {
								result.push(prefix);
								return;
							}
							for (let j = 0; j < rest.length; j += 1) {
								combine([...prefix, rest[j]], rest.slice(j + 1), n - 1);
							}
						};
						combine([], arr, i);
					}
					return result;
				};
				
				const allCombos = getCombinations(parentSelectors);
				for (const combo of allCombos) {
					const combined = `${combo.join(' ')} ${actionCopy.selector}`;
					if ((await this.page.locator(combined).count()) === 1) {
						actionCopy.selector = combined;
						return actionCopy;
					}
				}
				
				// Enhanced fallback: Try to generate a unique CSS selector with better parent traversal
				const uniqueSelector = await this.page.evaluate(sel => {
					const el = document.querySelectorAll(sel)[0];
					if (!el) return null;
					
					function getUniqueSelector(element, maxDepth = 5) {
						// First try data-testid, data-cy, role, aria-label, name
						if (element.getAttribute('data-testid'))
							return `[data-testid="${element.getAttribute('data-testid')}"]`;
						if (element.getAttribute('data-cy')) return `[data-cy="${element.getAttribute('data-cy')}"]`;
						if (element.getAttribute('role')) return `[role="${element.getAttribute('role')}"]`;
						if (element.getAttribute('aria-label'))
							return `[aria-label="${element.getAttribute('aria-label')}"]`;
						if (element.getAttribute('name')) return `[name="${element.getAttribute('name')}"]`;

						// Only use ID if it's not auto-generated and no other unique identifier exists
						if (element.id) {
							const { id } = element;
							// Check if ID looks auto-generated (e.g., mui-*, id*, etc.)
							if (!/^(mui-|id\d+|.*-\d+)$/.test(id)) {
								return `#${id}`;
							}
						}

						// Try class-based selector if available
						if (element.classList && element.classList.length) {
							const classSelector = '.' + Array.from(element.classList).join('.');
							if (document.querySelectorAll(classSelector).length === 1) return classSelector;
						}

						// Enhanced parent traversal: Look for parents with identifiers
						let current = element.parentElement;
						let depth = 0;
						
						while (current && depth < maxDepth) {
							// Check if this parent has any identifier
							const parentTestId = current.getAttribute('data-testid');
							const parentDataCy = current.getAttribute('data-cy');
							const parentRole = current.getAttribute('role');
							const parentAriaLabel = current.getAttribute('aria-label');
							const parentName = current.getAttribute('name');
							const parentId = current.id && !/^(mui-|id\d+|.*-\d+)$/.test(current.id) ? current.id : null;
							
							// Build parent selector using the best available identifier
							let parentSelector = null;
							if (parentTestId) {
								parentSelector = `[data-testid="${parentTestId}"]`;
							} else if (parentDataCy) {
								parentSelector = `[data-cy="${parentDataCy}"]`;
							} else if (parentRole) {
								parentSelector = `[role="${parentRole}"]`;
							} else if (parentAriaLabel) {
								parentSelector = `[aria-label="${parentAriaLabel}"]`;
							} else if (parentName) {
								parentSelector = `[name="${parentName}"]`;
							} else if (parentId) {
								parentSelector = `#${parentId}`;
							}
							
							if (parentSelector) {
								// Check if this parent selector + child creates a unique combination
								const siblings = Array.from(current.children);
								const index = siblings.indexOf(element) + 1;
								const combinedSelector = `${parentSelector} > :nth-child(${index})`;
								
								// Verify uniqueness
								if (document.querySelectorAll(combinedSelector).length === 1) {
									return combinedSelector;
								}
								
								// If not unique, try with more specific child selector
								const childSelector = getUniqueSelector(element, 0); // Don't recurse further
								if (childSelector && childSelector !== element.tagName.toLowerCase()) {
									const finalSelector = `${parentSelector} > ${childSelector}`;
									if (document.querySelectorAll(finalSelector).length === 1) {
										return finalSelector;
									}
								}
							}
							
							current = current.parentElement;
							depth += 1;
						}

						// If no unique identifier found, build a path using parent relationships
						if (element.parentElement) {
							const parentSelector = getUniqueSelector(element.parentElement, maxDepth - 1);
							if (parentSelector) {
								const siblings = Array.from(element.parentElement.children);
								const index = siblings.indexOf(element) + 1;
								return `${parentSelector} > :nth-child(${index})`;
							}
						}

						// Last resort: use tag name
						return element.tagName.toLowerCase();
					}
					return getUniqueSelector(el);
				}, actionCopy.selector);
				
				if (uniqueSelector && (await this.page.locator(uniqueSelector).count()) === 1) {
					actionCopy.selector = uniqueSelector;
					return actionCopy;
				}
				
				// If no unique parent combo or CSS selector, fallback to .first()
				actionCopy.first = true;
			}
		}
		return actionCopy;
	}

	/**
	 * Executes a natural language command using AI to convert it into specific Playwright actions.
	 * The function sends the command to an AI endpoint, parses the response into action objects,
	 * and executes them sequentially.
	 *
	 * @param {string} command - The natural language command to be executed (e.g., "click the submit button")
	 * @param {string} promptKey - The key to select the appropriate prompt (e.g., 'dragAndDrop', 'sign', 'template')
	 * @returns {Promise<void>} A promise that resolves when all actions are completed
	 * @throws {Error} If the AI response is invalid JSON or missing required fields
	 * @throws {Error} If the API request fails after all retries
	 *
	 * @example
	 * // Execute a drag and drop command
	 * await executeAICommand("drag bookmark to editor", "dragAndDrop");
	 *
	 * @example
	 * // Execute a sign command
	 * await executeAICommand("sign the document", "sign");
	 */
	async executeAICommand(command, promptKey) {
		const { aiConfig } = playwrightConfig;
		const endpoint = `${aiConfig.apiUrl}/openai/deployments/${aiConfig.model}/chat/completions?api-version=${aiConfig.apiVersion}`;

		// Get only visible interactive elements to reduce tokens
		const pageContent = await this.page.evaluate(() => {
			// Check if element is truly visible
			function isVisible(el) {
				if (!el || !el.offsetParent) return false;
				const style = window.getComputedStyle(el);
				if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
				const rect = el.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0;
			}

			// Get essential attributes only
			function getAttrs(el) {
				// Get parent element if it has an identifier
				const parent = el.parentElement;
				const parentIdentifier = parent ? {
					id: parent.id || undefined,
					'data-testid': parent.getAttribute('data-testid') || undefined,
					'data-cy': parent.getAttribute('data-cy') || undefined,
					'toolname': parent.getAttribute('toolname') || undefined,
					role: parent.getAttribute('role') || undefined,
				} : undefined;

				// Only include parent if it has at least one identifier
				const hasParentIdentifier = parentIdentifier && 
					(Object.values(parentIdentifier).some(val => val !== undefined));

				return {
					tag: el.tagName.toLowerCase(),
					id: el.id || undefined,
					'data-testid': el.getAttribute('data-testid') || undefined,
					'data-cy': el.getAttribute('data-cy') || undefined,
					'toolname': el.getAttribute('toolname') || undefined,
					role: el.getAttribute('role') || undefined,
					name: el.getAttribute('name') || undefined,
					text: el.textContent?.trim()?.substring(0, 50) || undefined, // Limit text length
					parent: hasParentIdentifier ? parentIdentifier : undefined
				};
			}

			// Find all interactive elements including those with parent identifiers
			const elements = Array.from(
				document.querySelectorAll(
					'button, input, select, [role="button"], [role="link"], [role="menuitem"], [data-cy], [data-testid], [contenteditable="true"], [toolname]'
				)
			)
			.filter(isVisible) // Only visible elements
			.map(el => getAttrs(el))
			.filter(attrs => 
				// Include element if it has any identifier or if its parent has an identifier
				attrs.id || 
				attrs['data-testid'] || 
				attrs['data-cy'] || 
				attrs.text || 
				attrs.parent
			);

			return {
				elements,
				url: window.location.href,
			};
		});

		// Select prompt based on the provided key
		let selectedPrompt;
		switch (promptKey) {
			case 'dragAndDrop':
				selectedPrompt = dragAndDropPrompt;
				break;
			default:
				selectedPrompt = basePrompt;
		}

		// Replace placeholders in the prompt
		const systemPrompt = selectedPrompt
			.replace('{{elements}}', JSON.stringify(pageContent.elements, null, 2))
			.replace('{{url}}', pageContent.url);

		// Create logs directory if it doesn't exist
		const logsDir = path.join(process.cwd(), 'ai-logs');
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}

		// Generate timestamp for the log file
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const logFileName = `ai-request-${timestamp}.json`;
		const logFilePath = path.join(logsDir, logFileName);

		// Prepare the log data
		const logData = {
			timestamp: new Date().toISOString(),
			command,
			promptKey,
			url: pageContent.url,
			elements: pageContent.elements,
			request: {
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: command
					}
				],
				temperature: 0,
				top_p: 1,
				max_tokens: 1000,
				response_format: { type: 'json_object' }
			}
		};

		// Save the log data
		try {
			fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
			console.log(`AI request data saved to: ${logFilePath}`);
		} catch (error) {
			console.error('Error saving AI request data:', error);
		}

		// Log the actual request payload being sent to AI
		const requestPayload = {
			messages: [
				{
					role: 'system',
					content: systemPrompt,
				},
				{
					role: 'user',
					content: command,
				},
			],
			temperature: 0,
			top_p: 1,
			max_tokens: 1000,
			response_format: { type: 'json_object' },
		};

		// Calculate approximate token counts
		const systemPromptTokens = Math.ceil(systemPrompt.length / 4);
		const userCommandTokens = Math.ceil(command.length / 4);
		const totalTokens = systemPromptTokens + userCommandTokens;

		console.log('=== AI Request Token Count ===');
		console.log(`System Prompt: ~${systemPromptTokens} tokens`);
		console.log(`User Command: ~${userCommandTokens} tokens`);
		console.log(`Total Tokens: ~${totalTokens} tokens`);
		console.log(`Visible Elements Sent: ${pageContent.elements.length}`);
		console.log('=============================');

		let lastError;
		const maxRetries = 3;
		const retryDelay = 1000;

		for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
			try {
				const response = await axios.post(endpoint, requestPayload, {
					headers: {
						'Content-Type': 'application/json',
						'api-key': aiConfig.apiKey,
					},
				});

				// Add detailed logging for debugging
				console.log('=== AI Response Debug ===');
				console.log('Response status:', response.status);
				console.log('Response data structure:', Object.keys(response.data));
				console.log('Choices length:', response.data.choices?.length);
				
				if (!response.data.choices || response.data.choices.length === 0) {
					throw new Error('AI response contains no choices');
				}

				const messageContent = response.data.choices[0].message?.content;
				if (!messageContent) {
					throw new Error('AI response message content is empty or null');
				}

				console.log('Raw message content length:', messageContent.length);
				console.log('Raw message content (first 500 chars):', messageContent.substring(0, 500));
				console.log('Raw message content (full):', messageContent);
				console.log('========================');

				// Parse the response content with better error handling
				let responseContent;
				try {
					responseContent = JSON.parse(messageContent);
				} catch (parseError) {
					console.error('Failed to parse AI response as JSON:', parseError);
					console.error('Raw content that failed to parse:', messageContent);
					throw new Error(`AI response is not valid JSON: ${parseError.message}`);
				}

				if (!responseContent) {
					throw new Error('AI response content is null or undefined after parsing');
				}

				console.log('Parsed response content:', JSON.stringify(responseContent, null, 2));
				console.log('Response content type:', typeof responseContent);
				console.log('Is array:', Array.isArray(responseContent));
				if (typeof responseContent === 'object' && responseContent !== null) {
					console.log('Response content keys:', Object.keys(responseContent));
				}

				// Extract actions with better fallback logic
				let actions;
				if (Array.isArray(responseContent)) {
					actions = responseContent;
					console.log('Response is an array, using directly as actions');
				} else if (responseContent && typeof responseContent === 'object') {
					actions = responseContent.actions || responseContent.action || responseContent.steps || responseContent;
					console.log('Response is an object, extracted actions from:', 
						responseContent.actions ? 'actions' : 
						responseContent.action ? 'action' : 
						responseContent.steps ? 'steps' : 'responseContent itself');
				} else {
					throw new Error(`Unexpected response content type: ${typeof responseContent}`);
				}

				console.log('Extracted actions:', actions);
				console.log('Actions type:', typeof actions);
				console.log('Is actions array:', Array.isArray(actions));

				if (!actions) {
					throw new Error('No actions found in AI response. Expected actions, action, steps, or array of actions.');
				}

				if (!Array.isArray(actions)) {
					// If it's a single action object, wrap it in an array
					if (typeof actions === 'object' && actions !== null && actions.type) {
						console.log('Single action object found, wrapping in array');
						actions = [actions];
					} else {
						console.error('Invalid response format:', JSON.stringify(responseContent, null, 2));
						throw new Error('Invalid response format: expected an array of actions or single action object with type');
					}
				}

				if (actions.length === 0) {
					throw new Error('AI response contains empty actions array');
				}

				console.log(`Successfully extracted ${actions.length} actions from AI response`);
				console.log('Actions:', JSON.stringify(actions, null, 2));

				// In executeAICommand, before executing each action:
				for (let i = 0; i < actions.length; i++) {
					actions[i] = await this.disambiguateSelector(actions[i]);
				}

				// Execute actions sequentially with validation and logging
				for (const action of actions) {
					if (!action.type) {
						console.error('Invalid action format:', JSON.stringify(action, null, 2));
						throw new Error('Invalid action format: missing type');
					}

									// --- Post-processing: Auto-correct only when there are duplicate elements ---
				if (
					action.method === 'getByText' &&
					action.text &&
					action.options &&
					action.options.exact === true &&
					Array.isArray(pageContent.elements)
				) {
					// First check if there are actually multiple elements with this text
					const allMatchingByText = pageContent.elements.filter(el => el.text === action.text);
					
					// Only apply auto-correction if there are multiple elements
					if (allMatchingByText.length > 1) {
						console.log(`Found ${allMatchingByText.length} elements matching text '${action.text}', checking for robust selectors...`);
						
						// Find elements with more robust selectors
						const matchingWithRobustSelector = allMatchingByText.filter(
							el => el['data-testid'] || el.id
						);
						
						if (matchingWithRobustSelector.length === 1) {
							// Only one element has a robust selector, use it
							if (matchingWithRobustSelector[0]['data-testid']) {
								console.warn(
									`Auto-correcting getByText('${action.text}') to getByTestId('${matchingWithRobustSelector[0]['data-testid']}') due to multiple text matches.`
								);
								action.method = 'getByTestId';
								action.testId = matchingWithRobustSelector[0]['data-testid'];
								delete action.text;
								delete action.options;
							} else if (matchingWithRobustSelector[0].id) {
								console.warn(
									`Auto-correcting getByText('${action.text}') to locator('[id="${matchingWithRobustSelector[0].id}"]') due to multiple text matches.`
								);
								action.method = undefined;
								action.selector = `[id="${matchingWithRobustSelector[0].id}"]`;
								delete action.text;
								delete action.options;
							}
						} else {
							// Multiple elements and no single robust selector, use .first()
							action.first = true;
							console.warn(
								`Multiple elements matched getByText('${action.text}') and no unique robust selector found. Falling back to .first().`
							);
						}
					} else {
						// Only one element matches, keep AI response as-is
						console.log(`Only one element matches text '${action.text}', keeping AI response unchanged.`);
					}
				}
				// --- End post-processing ---

					// Validate required fields based on action type
					if (action.type === 'dragAndDrop') {
						if (!action.sourceSelector || !action.targetSelector) {
							console.error('Invalid dragAndDrop action format:', JSON.stringify(action, null, 2));
							throw new Error('Invalid dragAndDrop action: missing sourceSelector or targetSelector');
						}
					} else if (action.type === 'press' && (action.key === 'MouseDown' || action.key === 'MouseUp')) {
						// Mouse press actions don't require a selector
						if (!action.key) {
							console.error('Invalid press action format:', JSON.stringify(action, null, 2));
							throw new Error('Invalid press action: missing key');
						}
					} else if (action.type !== 'navigate' && !action.selector && !action.method && !action.chain) {
						console.error('Invalid action format:', JSON.stringify(action, null, 2));
						throw new Error('Invalid action format: missing selector/method/chain');
					}

					if (action.type === 'dragAndDrop') {
						console.log(
							`Executing action: dragAndDrop from ${this.describeLocator(
								{ selector: action.sourceSelector }
							)} to ${this.describeLocator({ selector: action.targetSelector })}`
						);
					} else {
						console.log(`Executing action: ${action.type} on ${this.describeLocator(action)}`);
					}

					try {
						await this.executeAction(action);
						console.log(`Successfully executed action: ${action.type}`);
					} catch (actionError) {
						console.error(`Failed to execute action: ${action.type}`, actionError);
						throw actionError;
					}

					// Small delay between actions to prevent race conditions
					await this.page.waitForTimeout(100);
				}

				return;
			} catch (error) {
				lastError = error;
				console.error(`Attempt ${attempt} failed:`, error.message);
				if (error.response) {
					console.error('Response data:', error.response.data);
					console.error('Response status:', error.response.status);
					console.error('Response headers:', error.response.headers);
				}

				if (error.response?.status === 429 && attempt < maxRetries) {
					const delay = retryDelay * 2 ** (attempt - 1); // Exponential backoff
					console.log(`Rate limited. Waiting ${delay}ms before retry...`);
					await new Promise(resolve => setTimeout(resolve, delay));
				} else if (attempt === maxRetries) {
					throw new Error(`Failed to execute AI command after ${maxRetries} attempts: ${error.message}`);
				}
			}
		}

		throw lastError;
	}

	// Helper to describe a locator for logging
	describeLocator(action) {
		if (action.chain) {
			return action.chain
				.map(step => {
					if (step.method === 'getByTestId') return `getByTestId(${step.testId})`;
					if (step.method === 'getByRole')
						return `getByRole(${step.role}, ${JSON.stringify(step.options || {})})`;
					if (step.method === 'getByLabel') return `getByLabel(${step.label})`;
					if (step.method === 'getByText')
						return `getByText(${step.text}, ${JSON.stringify(step.options || {})})`;
					if (step.selector) return step.selector;
					return '[unknown]';
				})
				.join('.');
		}
		if (action.method) {
			if (action.method === 'getByTestId') return `getByTestId(${action.testId})`;
			if (action.method === 'getByRole')
				return `getByRole(${action.role}, ${JSON.stringify(action.options || {})})`;
			if (action.method === 'getByLabel') return `getByLabel(${action.label})`;
			if (action.method === 'getByText')
				return `getByText(${action.text}, ${JSON.stringify(action.options || {})})`;
		}
		if (action.selector) return action.selector;
		return '[unknown]';
	}

	// Universal locator resolver for AI action objects (supports chained locators)
	resolveLocator(action) {
		let locator = this.page;
		if (action.chain && Array.isArray(action.chain)) {
			for (let i = 0; i < action.chain.length; i++) {
				const step = action.chain[i];
				if (step.method === 'getByTestId') {
					const testId = step.testId || step.value;
					if (!testId) {
						console.error('Missing testId/value for getByTestId in chain step:', step);
						throw new Error('Missing testId/value for getByTestId in chain');
					}
					locator = locator.getByTestId(testId);
				} else if (step.method === 'getByRole') {
					locator = locator.getByRole(step.role, step.options || {});
				} else if (step.method === 'getByLabel') {
					locator = locator.getByLabel(step.label, step.options || {});
				} else if (step.method === 'getByText') {
					locator = locator.getByText(step.text, step.options || {});
				} else if (step.selector) {
					locator = locator.locator(step.selector);
				}
				// Only apply .first() or .last() at the last step in the chain
				if (i === action.chain.length - 1) {
					if (step.last && locator.last) locator = locator.last();
					if (step.first && locator.first) locator = locator.first();
				}
			}
			// Do not apply .first() or .last() redundantly
		} else {
			if (action.parent) {
				locator = locator.locator(action.parent);
			}
			if (action.method === 'getByTestId') {
				const testId = action.testId || action.value;
				if (!testId) {
					console.error('Missing testId/value for getByTestId in action:', action);
					throw new Error('Missing testId/value for getByTestId');
				}
				locator = locator.getByTestId(testId);
			} else if (action.method === 'getByRole') {
				locator = locator.getByRole(action.role, action.options || {});
			} else if (action.method === 'getByLabel') {
				locator = locator.getByLabel(action.label, action.options || {});
			} else if (action.method === 'getByText') {
				locator = locator.getByText(action.text, action.options || {});
			} else if (action.selector) {
				locator = locator.locator(action.selector);
			}
			if (action.last && locator.last) locator = locator.last();
			if (action.first && locator.first) locator = locator.first();
		}
		return locator;
	}

	/**
	 * Executes a single Playwright action based on the provided action object.
	 * Supports various action types including click, type, hover, and more.
	 *
	 * @param {Object} action - The action object to execute
	 * @param {string} action.type - The type of action to perform (e.g., 'click', 'type', 'hover')
	 * @param {string} [action.selector] - The CSS selector for the target element (required for most actions)
	 * @param {string} [action.text] - The text to type (required for 'type' action)
	 * @param {string} [action.url] - The URL to navigate to (required for 'navigate' action)
	 * @param {string} [action.key] - The key to press (required for 'press' action)
	 * @param {string} [action.value] - The value to select (required for 'select' action)
	 * @param {string} [action.sourceSelector] - The source element selector (required for 'dragAndDrop' action)
	 * @param {string} [action.targetSelector] - The target element selector (required for 'dragAndDrop' action)
	 * @returns {Promise<void>} A promise that resolves when the action is completed
	 * @throws {Error} If the action type is unknown or required parameters are missing
	 */
	async executeAction(action) {
		try {
			let locator = this.page;

			// Support parent + child chaining
			if (action.parent) {
				locator = locator.locator(action.parent);
			}

			// Handle different locator methods for the child
			if (action.chain) {
				for (let i = 0; i < action.chain.length; i++) {
					const step = action.chain[i];
					locator = this.applyLocatorMethod(locator, step);
					if (i === action.chain.length - 1 && step.index) {
						locator = locator.nth(step.index - 1);
					}
				}
			} else {
				locator = this.applyLocatorMethod(locator, action);
				if (action.index) {
					locator = locator.nth(action.index - 1); // 1-based to 0-based
				}
			}

			// Execute the action based on type
			switch (action.type) {
				case 'click':
					await locator.click();
					break;
				case 'type':
					await locator.fill(action.text);
					break;
				case 'hover':
					await locator.hover({ force: action.force || false });
					break;
				case 'waitForElement':
					await locator.waitFor({ timeout: action.timeout || 5000 });
					break;
				case 'press':
					await this.page.keyboard.press(action.key);
					break;
				case 'check':
					await locator.check();
					break;
				case 'uncheck':
					await locator.uncheck();
					break;
				case 'select':
					await locator.selectOption(action.value);
					break;
				case 'focus':
					await locator.focus();
					break;
				case 'blur':
					await locator.blur();
					break;
				case 'dblclick':
					await locator.dblclick();
					break;
				case 'navigate':
					await this.page.goto(action.url);
					break;
							case 'dragAndDrop': {
				const sourceLocator = this.page.locator(action.sourceSelector);
				const targetLocator = this.page.locator(action.targetSelector);
				await sourceLocator.dragTo(targetLocator);
				break;
			}
				default:
					throw new Error(`Unsupported action type: ${action.type}`);
			}
		} catch (error) {
			console.error('Error executing action:', error);
			throw error;
		}
	}

	applyLocatorMethod(baseLocator, action) {
		if (action.method === 'getByTestId') {
			return baseLocator.getByTestId(action.testId);
		} else if (action.method === 'getByRole') {
			return baseLocator.getByRole(action.role, action.options);
		} else if (action.method === 'getByText') {
			return baseLocator.getByText(action.text, action.options);
		} else if (action.method === 'getByLabel') {
			return baseLocator.getByLabel(action.label);
		} else if (action.selector) {
			return baseLocator.locator(action.selector);
		} else {
			throw new Error(`Unsupported locator method: ${action.method}`);
		}
	}

	/**
	 * Executes AI-based verification of elements on the page
	 * @param {string} verificationCommand - The verification command (e.g., "Verify all markup tools are selected")
	 * @returns {Promise<{success: boolean, results: Array<{element: string, checks: Array<{type: string, passed: boolean, message: string}>}>}>}
	 */
	async verifyElements(verificationCommand) {
		const { aiConfig } = playwrightConfig;
		const endpoint = `${aiConfig.apiUrl}/openai/deployments/${aiConfig.model}/chat/completions?api-version=${aiConfig.apiVersion}`;

		// Get page elements for AI analysis
		const pageContent = await this.page.evaluate(() => {
			function getKeyAttrs(el) {
				return {
					tag: el.tagName.toLowerCase(),
					id: el.id || undefined,
					'data-testid': el.getAttribute('data-testid') || undefined,
					'data-cy': el.getAttribute('data-cy') || undefined,
					role: el.getAttribute('role') || undefined,
					class: el.className || undefined,
					name: el.getAttribute('name') || undefined,
					ariaLabel: el.getAttribute('aria-label') || undefined,
					text: el.textContent?.trim() || undefined,
					selected: el.classList.contains('selected') || undefined,
					disabled: el.hasAttribute('disabled') || undefined,
					checked: el.hasAttribute('checked') || undefined,
					visible: el.offsetParent !== null,
					rect: el.getBoundingClientRect(),
				};
			}

			const elements = Array.from(
				document.querySelectorAll(
					'button, input, select, [role="button"], [role="link"], [role="menuitem"], [data-cy], [data-testid], [contenteditable="true"]'
				)
			).map(el => {
				const parents = [];
				let current = el.parentElement;
				let depth = 0;
				while (current && current !== document.body && depth < 3) {
					const attrs = getKeyAttrs(current);
					if (
						attrs['data-testid'] ||
						attrs['data-cy'] ||
						attrs.id ||
						attrs.role ||
						attrs.name ||
						attrs.ariaLabel
					) {
						parents.unshift(attrs);
					}
					current = current.parentElement;
					depth += 1;
				}

				return {
					attributes: getKeyAttrs(el),
					parents,
				};
			});

			return {
				elements,
				url: window.location.href,
			};
		});

		// Prepare the verification request
		const requestPayload = {
			messages: [
				{
					role: 'system',
					content: verificationPrompt
						.replace('{{elements}}', JSON.stringify(pageContent.elements, null, 2))
						.replace('{{url}}', pageContent.url),
				},
				{
					role: 'user',
					content: verificationCommand,
				},
			],
			temperature: 0,
			top_p: 1,
			max_tokens: 1000,
			response_format: { type: 'json_object' },
		};

		try {
			const response = await axios.post(endpoint, requestPayload, {
				headers: {
					'Content-Type': 'application/json',
					'api-key': aiConfig.apiKey,
				},
			});

			const verificationPlan = JSON.parse(response.data.choices[0].message.content);
			console.log('AI verification plan:', JSON.stringify(verificationPlan, null, 2));
			const results = [];

			// Execute each verification step
			for (const verification of verificationPlan.verifications) {
				const element = this.resolveLocator(verification.element);
				const elementResults = {
					element: this.describeLocator(verification.element),
					checks: [],
				};

				for (const check of verification.checks) {
					try {
						let passed = false;
						let message = '';

						switch (check.type) {
							case 'visibility':
								const isVisible = await element.isVisible();
								passed = isVisible === check.expected;
								message = `Element ${passed ? 'is' : 'is not'} visible`;
								break;

							case 'state':
								if (check.property === 'selected') {
									const hasSelectedClass = await element.evaluate(el =>
										el.classList.contains('selected')
									);
									passed = hasSelectedClass === check.expected;
									message = `Element is ${passed ? '' : 'not '}selected`;
								} else if (check.property === 'disabled') {
									const isDisabled = await element.isDisabled();
									passed = isDisabled === check.expected;
									message = `Element is ${passed ? '' : 'not '}disabled`;
								}
								break;

							case 'position':
								if (check.relativeTo) {
									const relativeElement = this.resolveLocator({
										method: 'getByTestId',
										value: check.relativeTo,
									});
									const [elementRect, relativeRect] = await Promise.all([
										element.boundingBox(),
										relativeElement.boundingBox(),
									]);

									if (elementRect && relativeRect) {
										switch (check.expected) {
											case 'before':
												passed = elementRect.x < relativeRect.x;
												message = `Element is ${
													passed ? '' : 'not '
												}before the reference element`;
												break;
											case 'after':
												passed = elementRect.x > relativeRect.x;
												message = `Element is ${
													passed ? '' : 'not '
												}after the reference element`;
												break;
											case 'inside':
												passed =
													elementRect.x >= relativeRect.x &&
													elementRect.y >= relativeRect.y &&
													elementRect.x + elementRect.width <=
														relativeRect.x + relativeRect.width &&
													elementRect.y + elementRect.height <=
														relativeRect.y + relativeRect.height;
												message = `Element is ${
													passed ? '' : 'not '
												}inside the reference element`;
												break;
										}
									}
								}
								break;

							case 'context':
								if (check.property === 'parent') {
									const parent = await element.locator('xpath=..').getAttribute('id');
									passed = parent === check.expected.replace('#', '');
									message = `Element ${passed ? 'is' : 'is not'} in the expected parent`;
								}
								break;
						}

						elementResults.checks.push({
							type: check.type,
							passed,
							message,
						});
					} catch (error) {
						elementResults.checks.push({
							type: check.type,
							passed: false,
							message: `Error during verification: ${error.message}`,
						});
					}
				}

				results.push(elementResults);
			}

			return {
				success: results.every(r => r.checks.every(c => c.passed)),
				results,
			};
		} catch (error) {
			console.error('Error during AI verification:', error);
			throw error;
		}
	}

	/**
	 * Demonstrates the enhanced parent traversal functionality
	 * This method shows how the system finds parents with proper identifiers
	 * @param {string} selector - The selector to test parent traversal for
	 * @returns {Promise<Object>} Information about the parent traversal
	 */
	async demonstrateParentTraversal(selector) {
		const result = await this.page.evaluate(sel => {
			const el = document.querySelector(sel);
			if (!el) return { error: 'Element not found' };
			
			function findParentWithIdentifiers(element, maxDepth = 5) {
				let current = element.parentElement;
				let depth = 0;
				const parents = [];
				
				while (current && depth < maxDepth) {
					const parentIdentifier = {
						id: current.id || undefined,
						'data-testid': current.getAttribute('data-testid') || undefined,
						'data-cy': current.getAttribute('data-cy') || undefined,
						'toolname': current.getAttribute('toolname') || undefined,
						role: current.getAttribute('role') || undefined,
						'aria-label': current.getAttribute('aria-label') || undefined,
						name: current.getAttribute('name') || undefined,
					};
					
					const hasIdentifier = Object.values(parentIdentifier).some(val => val !== undefined);
					
					parents.push({
						depth: depth + 1,
						tag: current.tagName.toLowerCase(),
						hasIdentifier,
						identifier: parentIdentifier,
						selector: hasIdentifier ? 
							(parentIdentifier['data-testid'] ? `[data-testid="${parentIdentifier['data-testid']}"]` :
							 parentIdentifier['data-cy'] ? `[data-cy="${parentIdentifier['data-cy']}"]` :
							 parentIdentifier.role ? `[role="${parentIdentifier.role}"]` :
							 parentIdentifier['aria-label'] ? `[aria-label="${parentIdentifier['aria-label']}"]` :
							 parentIdentifier.name ? `[name="${parentIdentifier.name}"]` :
							 parentIdentifier.id ? `#${parentIdentifier.id}` : null) : null
					});
					
					if (hasIdentifier) {
						break; // Found a parent with identifiers
					}
					
					current = current.parentElement;
					depth++;
				}
				
				return parents;
			}
			
			const parents = findParentWithIdentifiers(el);
			return {
				element: {
					tag: el.tagName.toLowerCase(),
					id: el.id || undefined,
					'data-testid': el.getAttribute('data-testid') || undefined,
					text: el.textContent?.trim()?.substring(0, 50) || undefined
				},
				parentTraversal: parents,
				recommendedSelector: parents.length > 0 && parents[0].selector ? 
					`${parents[0].selector} ${sel}` : sel
			};
		}, selector);
		
		console.log('Parent Traversal Analysis:', JSON.stringify(result, null, 2));
		return result;
	}
}