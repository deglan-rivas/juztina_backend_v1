import { Injectable } from '@nestjs/common';

// import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

import { orthographyCheckUseCase, sergioUseCase, getSemanticContext, askGraphRag } from './use-cases';
import { OrthographyDto, SergioDto } from './dtos';

@Injectable()
export class GptService {

  private openai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


  // Solo va a llamar casos de uso

  async orthographyCheck(orthographyDto: OrthographyDto) {
    return await orthographyCheckUseCase( this.openai, {
      prompt: orthographyDto.prompt
    });
  }

  async sergioCheck(sergioDto: SergioDto) {
    return await sergioUseCase( this.openai, {
      prompt: sergioDto.prompt
    });
  }

  async getSemanticContext(sergioDto: SergioDto) {
    return await getSemanticContext( this.openai, {
      prompt: sergioDto.prompt
    });
  }

  async askGraphRag(sergioDto: SergioDto) {
    return await askGraphRag( this.openai, {
      prompt: sergioDto.prompt
    });
  }

}
