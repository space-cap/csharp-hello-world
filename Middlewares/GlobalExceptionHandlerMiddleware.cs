using System.Net;
using System.Text.Json;

namespace csharp_hello_world.Middlewares;

/// <summary>
/// 컨트롤러 및 하위 계층에서 발생하는 미처리 예외를 잡아 표준 JSON 응답으로 변환하는 전역 미들웨어
/// </summary>
public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate _next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        this._next = _next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "잘못된 입력값 요청: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "서버 내부 처리 중 예외 발생: {Message}", ex.Message);
            await HandleExceptionAsync(context, HttpStatusCode.InternalServerError, "서버 내부 오류가 발생했습니다.");
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, HttpStatusCode statusCode, string message)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.StatusCode = (int)statusCode;

        var errorResponse = new
        {
            status = (int)statusCode,
            title = statusCode == HttpStatusCode.BadRequest ? "Bad Request" : "Internal Server Error",
            detail = message,
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(errorResponse);
        return context.Response.WriteAsync(json);
    }
}
