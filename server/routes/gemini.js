const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const router = express.Router();

router.post('/followup', async (req, res) => {

  console.log('FOLLOWUP ROUTE HIT');

  try {

    const {
      company,
      role,
      hrName,
      status,
      daysWaiting,
    } = req.body;

    let applicantName = 'Applicant';

    // GET USER FROM JWT
    const token =
      req.headers.authorization?.split(' ')[1];

    if (token) {

      try {

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        console.log(
          'JWT DECODED:',
          decoded
        );

        const userId =
          decoded.user?.id ||
          decoded.id ||
          decoded.userId ||
          decoded._id;

        console.log(
          'USER ID:',
          userId
        );

        if (userId) {

          const user =
            await User.findById(userId);

          console.log(
            'FOUND USER:',
            user
          );

          if (user?.name) {
            applicantName =
              user.name;
          }
        }

      } catch (jwtError) {

        console.log(
          'JWT ERROR:',
          jwtError.message
        );
      }
    }

    const prompt = `
Write a professional follow-up email.

Company: ${company}
Role: ${role}
HR Name: ${hrName || 'Not Available'}
Applicant Name: ${applicantName}

Current Status: ${status}
Days Since Last Update: ${daysWaiting}

Requirements:

- If HR Name exists, start with:
  Dear ${hrName},

- Otherwise start with:
  Dear Hiring Team,

- Include a subject line.
- Professional and polite tone.
- Ask for an application status update.
- Keep it concise.
- Do NOT use placeholders.

End the email exactly with:

Best regards,
${applicantName}
`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type':
            'application/json',
          'HTTP-Referer':
            'http://localhost:5173',
          'X-Title':
            'TrackHire',
        },
      }
    );

    const email =
      response.data.choices[0]
        .message.content;

    res.json({
      email,
    });

  } catch (error) {

    console.log(
      '=== OPENROUTER ERROR ==='
    );

    console.log(
      error.response?.data ||
      error.message
    );

    res.status(500).json({
      message:
        'Email generation failed',
    });
  }
});

module.exports = router;