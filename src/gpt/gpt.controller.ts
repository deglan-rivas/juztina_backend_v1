import { Body, Controller, Post } from '@nestjs/common';
import { GptService } from './gpt.service';
import { OrthographyDto, SergioDto } from './dtos';

@Controller('gpt')
export class GptController {

  constructor(private readonly gptService: GptService) {}

  @Post('orthography-check')
  orthographyCheck(
    @Body() orthographyDto: OrthographyDto,
  ) {
    return this.gptService.orthographyCheck(orthographyDto);
  }

  @Post('sergio-check')
  sergioCheck(
    @Body() sergioDto: SergioDto,
  ) {
    return this.gptService.sergioCheck(sergioDto);
  }

  @Post('get-semantic-context')
  getSemanticContext(
    @Body() sergioDto: SergioDto,
  ) {
    return this.gptService.getSemanticContext(sergioDto);
  }

  @Post('ask-graph-rag')
  askGraphRag(
    @Body() sergioDto: SergioDto,
  ) {
    return this.gptService.askGraphRag(sergioDto);
  }

}
